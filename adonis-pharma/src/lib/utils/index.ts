// src/lib/utils/formatters.ts

/**
 * Format a value in Indian rupee notation
 * < 1 Lakh: ₹12,345
 * 1L – 99L: ₹12.3L
 * 1Cr+: ₹1.2Cr
 */
export function formatINR(value: number, compact = true): string {
  if (!compact || Math.abs(value) < 100_000) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (Math.abs(value) < 10_000_000) {
    return `₹${(value / 100_000).toFixed(1)}L`
  }
  return `₹${(value / 10_000_000).toFixed(2)}Cr`
}

export function formatUnits(value: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(value))
}

export function formatPct(value: number | null): string {
  if (value === null || isNaN(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatGrowthPct(value: number | null): string {
  if (value === null) return 'N/A'
  return formatPct(value)
}

/**
 * Truncate long names for table display
 */
export function truncate(str: string, maxLen = 25): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '…'
}

// src/lib/utils/constants.ts

export const PERIOD_OPTIONS = [
  { value: 'MTD',         label: 'MTD' },
  { value: 'Monthly',     label: 'Monthly' },
  { value: 'Bimonthly',   label: 'Bimonthly' },
  { value: 'Quarterly',   label: 'Quarterly' },
  { value: 'HalfYearly',  label: 'Half Yearly' },
  { value: 'YTD',         label: 'YTD' },
  { value: 'Annual',      label: 'Annual' },
] as const

export const FISCAL_MONTHS = [
  { value: 1,  label: 'April' },
  { value: 2,  label: 'May' },
  { value: 3,  label: 'June' },
  { value: 4,  label: 'July' },
  { value: 5,  label: 'August' },
  { value: 6,  label: 'September' },
  { value: 7,  label: 'October' },
  { value: 8,  label: 'November' },
  { value: 9,  label: 'December' },
  { value: 10, label: 'January' },
  { value: 11, label: 'February' },
  { value: 12, label: 'March' },
] as const

export const ROLE_LABELS: Record<string, string> = {
  be:    'Business Executive',
  asm:   'Area Sales Manager',
  rsm:   'Regional Sales Manager',
  zsm:   'Zonal Sales Manager',
  vp:    'VP / National',
  admin: 'Admin',
}

export const NAV_ITEMS_BY_ROLE: Record<string, string[]> = {
  be: [
    '/dashboard',
    '/sales/hq',
    '/stock/statement',
    '/forecasting',
  ],
  asm: [
    '/dashboard',
    '/sales/hq',
    '/sales/employee',
    '/products/wise',
    '/stock/dashboard',
    '/stock/statement',
    '/forecasting',
    '/analytics/growth',
    '/reports',
  ],
  rsm: [
    '/dashboard',
    '/sales/hq',
    '/sales/employee',
    '/sales/manager',
    '/products/category',
    '/products/wise',
    '/stock/dashboard',
    '/forecasting',
    '/analytics/growth',
    '/analytics/productivity',
    '/analytics/rankings',
    '/reports',
  ],
  zsm: [
    '/dashboard',
    '/sales/hq',
    '/sales/employee',
    '/sales/manager',
    '/sales/geography',
    '/products/category',
    '/products/wise',
    '/stock/dashboard',
    '/stock/exceptions',
    '/forecasting',
    '/analytics/growth',
    '/analytics/productivity',
    '/analytics/trends',
    '/analytics/variance',
    '/analytics/rankings',
    '/reports',
  ],
  admin: [
    '/dashboard',
    '/sales/hq',
    '/sales/employee',
    '/sales/manager',
    '/sales/geography',
    '/products/category',
    '/products/wise',
    '/stock/dashboard',
    '/stock/statement',
    '/stock/exceptions',
    '/forecasting',
    '/analytics/growth',
    '/analytics/productivity',
    '/analytics/trends',
    '/analytics/variance',
    '/analytics/rankings',
    '/reports',
    '/admin/upload',
    '/admin/users',
    '/admin/targets',
    '/admin/masters',
  ],
}
