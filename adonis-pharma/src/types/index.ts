// src/types/auth.ts
export type UserRole = 'be' | 'asm' | 'rsm' | 'zsm' | 'vp' | 'admin'

export interface UserProfile {
  id: string
  authUserId: string
  empId: string
  role: UserRole
  employee?: Employee
}

// src/types/sales.ts
export interface Employee {
  empId: string
  name: string
  designation: string
  primaryHqCode: string
  managerEmpId?: string
  isActive: boolean
}

export interface HQ {
  hqCode: string
  hqName: string
  regionCode?: string
  stateCode?: string
}

export interface SalesRow {
  hqCode: string
  hqName: string
  empId?: string
  empName?: string
  productCode: string
  productName: string
  brandCategory: 'Pillar' | 'Others'
  fiscalYear: number
  month: number
  totalUnits: number
  totalValue: number
  lyUnits: number
  lyValue: number
}

export interface AchievementRow extends SalesRow {
  valueTarget: number
  unitTarget: number
  achievementPct: number
  growthPct: number
  gapToTarget: number
  ranking?: number
}

export type PeriodFilter = 'MTD' | 'Monthly' | 'Bimonthly' | 'Quarterly' | 'HalfYearly' | 'YTD' | 'Annual'

export interface DateRange {
  from: Date
  to: Date
}

// src/types/stock.ts
export interface StockEntry {
  id: string
  stockistCode: string
  stockistName: string
  empId: string
  hqCode: string
  productCode: string
  productName: string
  fiscalYear: number
  month: number
  openingQty: number
  openingValue: number
  primaryQty: number
  primaryValue: number
  saleRate: number
  secondaryQty: number        // BE-editable
  secondaryValue: number
  closingQty: number          // computed: opening + primary - secondary
  closingValue: number        // computed: closingQty × saleRate
  beSubmitted: boolean
  submittedAt?: string
}

export interface StockSummary {
  productCode: string
  productName: string
  totalOpeningQty: number
  totalPrimaryQty: number
  totalSecondaryQty: number
  totalClosingQty: number
  totalClosingValue: number
  inventoryDays: number
  isDeadStock: boolean
  isFastMoving: boolean
}

// src/types/forecast.ts
export interface ForecastRow {
  stockistCode: string
  stockistName: string
  productCode: string
  productName: string
  fiscalYear: number
  month: number
  m1Sale: number
  m2Sale: number
  m3Sale: number
  systemForecastQty: number   // auto: avg of m1+m2+m3
  managerForecastQty?: number // manager override
}

// src/types/upload.ts
export interface ParsedSalesDumpRow {
  cfaCode: string
  cfaName: string
  stockistCode: string
  stockistName: string
  productCode: string         // may be alias — will be resolved
  billDate: string
  quantity: number
  freeQty: number
  saleRate: number
  amount: number
  hqCode?: string             // resolved from stockist mapping
  empId?: string              // resolved from HQ mapping
}

export interface UploadResult {
  batchId: string
  rowsProcessed: number
  rowsFailed: number
  errors: string[]
  status: 'completed' | 'failed'
}
