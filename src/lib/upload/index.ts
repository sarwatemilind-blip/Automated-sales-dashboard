// src/lib/upload/parseSalesDump.ts
// Parses the monthly stockist sales dump Excel (same column format as APR26 SALE.XLSX etc.)

import * as XLSX from 'xlsx'
import type { ParsedSalesDumpRow } from '@/types'

// Expected column headers in the dump file
const COLUMN_MAP: Record<string, keyof ParsedSalesDumpRow> = {
  'Distributor Code':   'cfaCode',
  'Distributorname':    'cfaName',
  'Stockist Code':      'stockistCode',
  'Stockist Name':      'stockistName',
  'Product Code':       'productCode',
  'Bill Date':          'billDate',
  'Quantity':           'quantity',
  'Free Qty':           'freeQty',
  'Sale Rate':          'saleRate',
  'Amount':             'amount',
}

export interface ParseResult {
  rows: ParsedSalesDumpRow[]
  errors: string[]
  totalRows: number
}

export function parseSalesDump(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    raw: false,
    dateNF: 'yyyy-mm-dd',
    defval: '',
  })

  const rows: ParsedSalesDumpRow[] = []
  const errors: string[] = []

  raw.forEach((r, i) => {
    const rowNum = i + 2  // 1-indexed + header row

    // Skip blank or summary rows
    if (!r['Stockist Code'] && !r['Product Code']) return

    const stockistCode = String(r['Stockist Code'] ?? '').trim()
    const productCode  = String(r['Product Code'] ?? '').trim()
    const cfaCode      = String(r['Distributor Code'] ?? '').trim()
    const quantity     = parseFloat(String(r['Quantity'] ?? '0'))
    const saleRate     = parseFloat(String(r['Sale Rate'] ?? '0'))
    const amount       = parseFloat(String(r['Amount'] ?? '0'))
    const billDate     = String(r['Bill Date'] ?? '').trim()
    const freeQty      = parseFloat(String(r['Free Qty'] ?? '0'))

    if (!stockistCode) { errors.push(`Row ${rowNum}: missing Stockist Code`); return }
    if (!productCode)  { errors.push(`Row ${rowNum}: missing Product Code`); return }
    if (!cfaCode)      { errors.push(`Row ${rowNum}: missing Distributor Code`); return }
    if (!billDate)     { errors.push(`Row ${rowNum}: missing Bill Date`); return }

    rows.push({
      cfaCode,
      cfaName:      String(r['Distributorname'] ?? '').trim(),
      stockistCode,
      stockistName: String(r['Stockist Name'] ?? '').trim(),
      productCode,   // still may be an alias — resolved by clubProducts()
      billDate,
      quantity:  isNaN(quantity) ? 0 : quantity,
      freeQty:   isNaN(freeQty)  ? 0 : freeQty,
      saleRate:  isNaN(saleRate) ? 0 : saleRate,
      amount:    isNaN(amount)   ? 0 : amount,
    })
  })

  return { rows, errors, totalRows: raw.length }
}


// src/lib/upload/clubProducts.ts
// Resolves alias product codes to canonical product codes using the DB map.
// Pass productCodeMap as { aliasCode → canonicalCode } (pre-loaded once per upload batch).

export function resolveProductCode(
  rawCode: string,
  productCodeMap: Map<string, string>
): string {
  return productCodeMap.get(rawCode) ?? rawCode
}

export function clubProductsInRows(
  rows: ParsedSalesDumpRow[],
  productCodeMap: Map<string, string>
): ParsedSalesDumpRow[] {
  return rows.map(row => ({
    ...row,
    productCode: resolveProductCode(row.productCode, productCodeMap),
  }))
}


// src/lib/upload/mapStockistToHQ.ts
// Resolves stockist codes to HQ code + employee IDs.
// Pass stockistMap as { stockistCode → { hqCode, empId } } (pre-loaded once per batch).

export interface StockistMapping {
  hqCode: string
  empId?: string
}

export function enrichRowsWithHQAndEmployee(
  rows: ParsedSalesDumpRow[],
  stockistMap: Map<string, StockistMapping>
): { enriched: ParsedSalesDumpRow[]; unmapped: string[] } {
  const unmappedSet = new Set<string>()
  const enriched = rows.map(row => {
    const mapping = stockistMap.get(row.stockistCode)
    if (!mapping) {
      unmappedSet.add(row.stockistCode)
      return row
    }
    return { ...row, hqCode: mapping.hqCode, empId: mapping.empId }
  })
  return { enriched, unmapped: Array.from(unmappedSet) }
}


// src/lib/upload/validateDump.ts
// Quick sanity checks before inserting into DB.

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateParsedRows(
  rows: ParsedSalesDumpRow[],
  knownStockistCodes: Set<string>,
  knownProductCodes: Set<string>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (rows.length === 0) {
    errors.push('No valid rows found in the uploaded file.')
    return { valid: false, errors, warnings }
  }

  const unknownStockists = new Set<string>()
  const unknownProducts  = new Set<string>()

  rows.forEach(row => {
    if (!knownStockistCodes.has(row.stockistCode)) unknownStockists.add(row.stockistCode)
    if (!knownProductCodes.has(row.productCode))   unknownProducts.add(row.productCode)
    if (row.quantity < 0)   warnings.push(`Negative quantity for stockist ${row.stockistCode} product ${row.productCode}`)
    if (row.saleRate <= 0)  warnings.push(`Zero/negative sale rate for product ${row.productCode}`)
  })

  if (unknownStockists.size > 0) {
    warnings.push(`${unknownStockists.size} stockist codes not in master (will be skipped): ${[...unknownStockists].slice(0, 5).join(', ')}${unknownStockists.size > 5 ? '...' : ''}`)
  }
  if (unknownProducts.size > 0) {
    warnings.push(`${unknownProducts.size} product codes not in master (will be skipped): ${[...unknownProducts].slice(0, 5).join(', ')}${unknownProducts.size > 5 ? '...' : ''}`)
  }

  return { valid: errors.length === 0, errors, warnings }
}
