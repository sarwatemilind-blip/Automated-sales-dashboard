// src/app/api/upload/sales-dump/route.ts
// POST /api/upload/sales-dump
// Admin-only. Accepts multipart form with Excel file + { month, fiscalYear }.
// Pipeline: parse → club products → map stockist→HQ→employee → validate → insert

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  parseSalesDump,
  clubProductsInRows,
  enrichRowsWithHQAndEmployee,
  validateParsedRows,
} from '@/lib/upload'
import { toFiscalPeriod } from '@/lib/calculations'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  // Auth check — admin only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, emp_id')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Parse form data
  const form = await req.formData()
  const file = form.get('file') as File | null
  const month = parseInt(form.get('month') as string)
  const fiscalYear = parseInt(form.get('fiscal_year') as string)

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!month || month < 1 || month > 12) return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  if (!fiscalYear) return NextResponse.json({ error: 'Invalid fiscal_year' }, { status: 400 })

  // Create upload batch record
  const { data: batch, error: batchErr } = await supabase
    .from('upload_batches')
    .insert({
      month,
      fiscal_year: fiscalYear,
      uploaded_by: profile.emp_id,
      status: 'processing',
    })
    .select()
    .single()

  if (batchErr) return NextResponse.json({ error: batchErr.message }, { status: 500 })

  try {
    // Step 1: Parse Excel
    const buffer = await file.arrayBuffer()
    const { rows: parsedRows, errors: parseErrors } = parseSalesDump(buffer)

    if (parsedRows.length === 0) {
      await supabase.from('upload_batches')
        .update({ status: 'failed', error_log: parseErrors.join('\n') })
        .eq('id', batch.id)
      return NextResponse.json({ error: 'No rows parsed', details: parseErrors }, { status: 422 })
    }

    // Step 2: Load product code map (alias → canonical)
    const { data: codeMap } = await supabase
      .from('product_code_map')
      .select('alias_code, canonical_product_code')
    const productCodeMap = new Map((codeMap ?? []).map(r => [r.alias_code, r.canonical_product_code]))

    // Step 3: Club products (resolve alias codes)
    const clubbedRows = clubProductsInRows(parsedRows, productCodeMap)

    // Step 4: Load stockist → HQ + employee map
    const { data: stockistData } = await supabase
      .from('stockists')
      .select('stockist_code, hq_code, employee_hq_map(emp_id, slot)')
    const stockistMap = new Map(
      (stockistData ?? []).map(s => [
        s.stockist_code,
        {
          hqCode: s.hq_code,
          // prefer slot 1 BE; if multi-BE HQ, all transactions go to HQ level (emp_id = null)
          empId: s.employee_hq_map?.length === 1 ? s.employee_hq_map[0].emp_id : undefined,
        },
      ])
    )

    // Step 5: Enrich rows with HQ + employee
    const { enriched, unmapped } = enrichRowsWithHQAndEmployee(clubbedRows, stockistMap)

    // Step 6: Validate
    const knownStockistCodes = new Set((stockistData ?? []).map(s => s.stockist_code))
    const { data: productData } = await supabase.from('products').select('product_code')
    const knownProductCodes = new Set((productData ?? []).map(p => p.product_code))

    const { valid, errors: validationErrors, warnings } = validateParsedRows(
      enriched, knownStockistCodes, knownProductCodes
    )

    // Step 7: Insert transactions in batches of 500
    const validRows = enriched.filter(r => knownStockistCodes.has(r.stockistCode) && knownProductCodes.has(r.productCode))
    const insertRows = validRows.map(r => ({
      cfa_code:        r.cfaCode,
      stockist_code:   r.stockistCode,
      product_code:    r.productCode,
      hq_code:         r.hqCode ?? null,
      emp_id:          r.empId ?? null,
      bill_date:       r.billDate,
      fiscal_year:     fiscalYear,
      month,
      quantity:        r.quantity,
      free_qty:        r.freeQty,
      sale_rate:       r.saleRate,
      amount:          r.amount,
      upload_batch_id: batch.id,
    }))

    const BATCH_SIZE = 500
    for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
      await supabase.from('sales_transactions').insert(insertRows.slice(i, i + BATCH_SIZE))
    }

    // Step 8: Refresh monthly summary (upsert aggregated view)
    await refreshMonthlySummary(supabase, fiscalYear, month)

    // Step 9: Refresh system forecast
    await refreshSystemForecast(supabase, fiscalYear, month)

    // Step 10: Auto-populate next month opening stock from this month's closing
    await propagateStockOpenings(supabase, fiscalYear, month)

    // Update batch status
    await supabase.from('upload_batches').update({
      status: 'completed',
      rows_processed: validRows.length,
      error_log: [...validationErrors, ...warnings, ...unmapped.map(s => `Unmapped stockist: ${s}`)].join('\n') || null,
    }).eq('id', batch.id)

    return NextResponse.json({
      batchId: batch.id,
      rowsProcessed: validRows.length,
      rowsSkipped: parsedRows.length - validRows.length,
      warnings,
      unmappedStockists: unmapped.length,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await supabase.from('upload_batches').update({
      status: 'failed',
      error_log: msg,
    }).eq('id', batch.id)
    return NextResponse.json({ error: msg, batchId: batch.id }, { status: 500 })
  }
}

// Aggregate sales_transactions → monthly_sales_summary for the uploaded month
async function refreshMonthlySummary(supabase: any, fiscalYear: number, month: number) {
  // Fetch current month aggregates
  const { data } = await supabase.rpc('aggregate_monthly_sales', { p_fiscal_year: fiscalYear, p_month: month })
  // The RPC handles the upsert — see SQL function below
}

async function refreshSystemForecast(supabase: any, fiscalYear: number, month: number) {
  await supabase.rpc('refresh_system_forecast', { p_fiscal_year: fiscalYear, p_month: month })
}

async function propagateStockOpenings(supabase: any, fiscalYear: number, month: number) {
  await supabase.rpc('propagate_stock_openings', { p_fiscal_year: fiscalYear, p_month: month })
}
