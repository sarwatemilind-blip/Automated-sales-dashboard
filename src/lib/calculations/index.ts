// src/lib/calculations/achievement.ts

/**
 * Achievement % = (achievement / target) × 100
 * Returns 0 if target is 0 to avoid division by zero
 */
export function achievementPct(achievement: number, target: number): number {
  if (target === 0) return 0
  return Math.round((achievement / target) * 10000) / 100  // 2 decimal places
}

/**
 * Gap to target = target - achievement
 * Negative value means over-achievement
 */
export function gapToTarget(achievement: number, target: number): number {
  return target - achievement
}

/**
 * When a HQ has multiple BEs, split target and achievement equally
 * Rule from spec: individual_target = hq_target / no_of_bes
 */
export function splitByBECount<T extends { valueTarget: number; unitTarget: number; totalValue: number; totalUnits: number }>(
  row: T,
  noOfBEs: number
): T {
  if (noOfBEs <= 1) return row
  return {
    ...row,
    valueTarget: row.valueTarget / noOfBEs,
    unitTarget: Math.round(row.unitTarget / noOfBEs),
    totalValue: row.totalValue / noOfBEs,
    totalUnits: Math.round(row.totalUnits / noOfBEs),
  }
}

// src/lib/calculations/growth.ts

/**
 * Growth % = ((CY - LY) / LY) × 100
 * Returns null if LY is 0 (no prior year data)
 */
export function growthPct(cy: number, ly: number): number | null {
  if (ly === 0) return null
  return Math.round(((cy - ly) / ly) * 10000) / 100
}

export function growthLabel(pct: number | null): string {
  if (pct === null) return 'N/A'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

// src/lib/calculations/stock.ts

/**
 * Closing qty = opening + primary - secondary
 * (Also enforced as a generated column in the DB)
 */
export function closingQty(opening: number, primary: number, secondary: number): number {
  return opening + primary - secondary
}

/**
 * Closing value = closing qty × sale rate
 */
export function closingValue(closing: number, saleRate: number): number {
  return Math.round(closing * saleRate * 100) / 100
}

/**
 * Inventory days = (closing qty / avg monthly secondary) × 30
 * Uses last 3 months of secondary sales for the average
 */
export function inventoryDays(closingQtyVal: number, avgMonthlySale: number): number {
  if (avgMonthlySale === 0) return closingQtyVal > 0 ? 999 : 0
  return Math.round((closingQtyVal / avgMonthlySale) * 30)
}

/**
 * Dead stock: inventory days > 90 and closing qty > 0
 */
export function isDeadStock(invDays: number, closingQtyVal: number): boolean {
  return closingQtyVal > 0 && invDays > 90
}

/**
 * Fast moving: inventory days < 15
 */
export function isFastMoving(invDays: number): boolean {
  return invDays > 0 && invDays < 15
}

// src/lib/calculations/forecast.ts

/**
 * System forecast = average of last 3 months' sales
 * (Also stored as a generated column in the DB)
 */
export function systemForecast(m1: number, m2: number, m3: number): number {
  return Math.round(((m1 + m2 + m3) / 3) * 100) / 100
}

// src/lib/calculations/targets.ts

/**
 * Determine fiscal year and month from a calendar date
 * Adonis fiscal year: April = month 1 ... March = month 12
 */
export function toFiscalPeriod(date: Date): { fiscalYear: number; month: number } {
  const calMonth = date.getMonth() + 1  // 1-12
  const calYear = date.getFullYear()

  // April (4) = fiscal month 1, March (3) = fiscal month 12
  if (calMonth >= 4) {
    return { fiscalYear: calYear, month: calMonth - 3 }
  } else {
    return { fiscalYear: calYear - 1, month: calMonth + 9 }
  }
}

/**
 * Convert fiscal month (1-12) back to display label e.g. "April 2026"
 */
export function fiscalMonthLabel(fiscalMonth: number, fiscalYear: number): string {
  const months = ['April','May','June','July','August','September',
                  'October','November','December','January','February','March']
  const calYear = fiscalMonth <= 9 ? fiscalYear : fiscalYear + 1
  return `${months[fiscalMonth - 1]} ${calYear}`
}

/**
 * Returns an array of { fiscalYear, month } for a given period filter
 */
export function periodToMonths(
  period: string,
  currentFiscalYear: number,
  currentFiscalMonth: number
): Array<{ fiscalYear: number; month: number }> {
  const all: Array<{ fiscalYear: number; month: number }> = []
  const today = { fiscalYear: currentFiscalYear, month: currentFiscalMonth }

  switch (period) {
    case 'MTD':
    case 'Monthly':
      return [today]
    case 'Bimonthly':
      for (let i = 1; i >= 0; i--) {
        const m = currentFiscalMonth - i
        all.push(m > 0
          ? { fiscalYear: currentFiscalYear, month: m }
          : { fiscalYear: currentFiscalYear - 1, month: m + 12 })
      }
      return all
    case 'Quarterly':
      for (let i = 2; i >= 0; i--) {
        const m = currentFiscalMonth - i
        all.push(m > 0
          ? { fiscalYear: currentFiscalYear, month: m }
          : { fiscalYear: currentFiscalYear - 1, month: m + 12 })
      }
      return all
    case 'HalfYearly':
      for (let i = 5; i >= 0; i--) {
        const m = currentFiscalMonth - i
        all.push(m > 0
          ? { fiscalYear: currentFiscalYear, month: m }
          : { fiscalYear: currentFiscalYear - 1, month: m + 12 })
      }
      return all
    case 'YTD':
      for (let m = 1; m <= currentFiscalMonth; m++) {
        all.push({ fiscalYear: currentFiscalYear, month: m })
      }
      return all
    case 'Annual':
      for (let m = 1; m <= 12; m++) {
        all.push({ fiscalYear: currentFiscalYear, month: m })
      }
      return all
    default:
      return [today]
  }
}
