export interface MockProductYTDMetric {
  qty: number
  value: number
  cost: number
  grossProfit: number
  marginPct: number
}

export interface MockProductYTDComparison {
  current: MockProductYTDMetric
  prior: MockProductYTDMetric
  diffValue: number
  diffQty: number
  growthValuePct: number | null
  growthQtyPct: number | null
}

export interface MockProductYTDRow {
  id: string
  no: number
  code: string
  name: string
  unit: string | null
  isPush: boolean
  month: MockProductYTDComparison
  ytd: MockProductYTDComparison
}

export interface MockProductYTDReport {
  company: string
  targetYear: number
  targetMonth: number
  channel: string
  availableYears: number[]
  rows: MockProductYTDRow[]
  summaryTotal: MockProductYTDRow
}

export interface MockProductYTDResponse {
  success: boolean
  data?: MockProductYTDReport
  error?: {
    code: string
    message: string
  }
}

interface RawProductSeed {
  code: string
  name: string
  unit: string
  isPush: boolean
  baseValue: number
  baseCost: number
  baseQty: number
}

const companyProductSeeds: Record<string, RawProductSeed[]> = {
  toc: [
    {
      code: '11T22-0100B',
      name: 'โทคาร์ลอล 25 มก.(10X10เม็ด) อลู-อลู',
      unit: 'กล่อง',
      isPush: true,
      baseValue: 500000,
      baseCost: 350000,
      baseQty: 1200,
    },
    {
      code: '11T28-0100B',
      name: 'โทคาร์ลอล 6.25 มก.(10X10เม็ด) อลู-อลู',
      unit: 'กล่อง',
      isPush: true,
      baseValue: 300000,
      baseCost: 200000,
      baseQty: 800,
    },
    {
      code: '11A01-0100B',
      name: 'อะม็อกซีซิลลิน 500 มก.(10X10แคปซูล)',
      unit: 'กล่อง',
      isPush: false,
      baseValue: 700000,
      baseCost: 520000,
      baseQty: 2500,
    },
    {
      code: '11P05-0050B',
      name: 'พาราเซตามอล 500 มก.(50X10เม็ด)',
      unit: 'กล่อง',
      isPush: false,
      baseValue: 400000,
      baseCost: 280000,
      baseQty: 3000,
    },
  ],
  ptoc: [
    {
      code: '21T10-0100B',
      name: 'พีทีโอซี-การ์ด 10 มก.',
      unit: 'ขวด',
      isPush: true,
      baseValue: 450000,
      baseCost: 300000,
      baseQty: 1000,
    },
    {
      code: '21B02-0050B',
      name: 'เบต้า-คล็อก 50 มก.',
      unit: 'กล่อง',
      isPush: false,
      baseValue: 350000,
      baseCost: 250000,
      baseQty: 1500,
    },
  ],
  tol: [
    {
      code: '31L01-0100B',
      name: 'ทีโอแอล-มัยซิน 100 มล.',
      unit: 'ขวด',
      isPush: true,
      baseValue: 600000,
      baseCost: 400000,
      baseQty: 1400,
    },
    {
      code: '31S02-0050B',
      name: 'โซเดียมไบคาร์บอน 50 กรัม',
      unit: 'ซอง',
      isPush: false,
      baseValue: 250000,
      baseCost: 180000,
      baseQty: 2000,
    },
  ],
  top: [
    {
      code: '41P01-0100B',
      name: 'ท็อป-วิตามินซี 500 มก.',
      unit: 'แผง',
      isPush: true,
      baseValue: 550000,
      baseCost: 360000,
      baseQty: 2200,
    },
    {
      code: '41C03-0050B',
      name: 'แคลเซียม พลัส ดี',
      unit: 'ขวด',
      isPush: false,
      baseValue: 420000,
      baseCost: 290000,
      baseQty: 1100,
    },
  ],
}

function createMetric(qty: number, value: number, cost: number): MockProductYTDMetric {
  const grossProfit = value - cost
  const marginPct = value > 0 ? (grossProfit / value) * 100 : 0
  return {
    qty: Math.round(qty),
    value: Math.round(value),
    cost: Math.round(cost),
    grossProfit: Math.round(grossProfit),
    marginPct: Number(marginPct.toFixed(2)),
  }
}

function createComparison(
  current: MockProductYTDMetric,
  prior: MockProductYTDMetric,
): MockProductYTDComparison {
  const diffValue = current.value - prior.value
  const diffQty = current.qty - prior.qty
  const growthValuePct = prior.value > 0 ? ((diffValue) / prior.value) * 100 : null
  const growthQtyPct = prior.qty > 0 ? ((diffQty) / prior.qty) * 100 : null

  return {
    current,
    prior,
    diffValue,
    diffQty,
    growthValuePct: growthValuePct !== null ? Number(growthValuePct.toFixed(2)) : null,
    growthQtyPct: growthQtyPct !== null ? Number(growthQtyPct.toFixed(2)) : null,
  }
}

export function getMockProductYTDResponse(
  company = 'toc',
  targetYear = 2025,
  targetMonth = 6,
  channel = 'all',
): MockProductYTDResponse {
  const compKey = company.toLowerCase()
  const seeds = companyProductSeeds[compKey]

  if (!seeds) {
    return {
      success: false,
      error: {
        code: 'invalid_company',
        message: `unsupported company: ${company}`,
      },
    }
  }

  // Filter seeds by channel
  const filteredSeeds = seeds.filter((s) => {
    if (channel === 'push') return s.isPush
    if (channel === 'nonpush') return !s.isPush
    return true
  })

  const yearFactor = targetYear === 2024 ? 0.9 : targetYear === 2026 ? 1.15 : 1.0
  const monthFactor = 0.8 + (targetMonth / 12) * 0.4 // between 0.83 and 1.2

  const rows: MockProductYTDRow[] = filteredSeeds.map((seed, idx) => {
    // Current month metrics
    const mCurVal = seed.baseValue * yearFactor * monthFactor
    const mCurCost = seed.baseCost * yearFactor * monthFactor
    const mCurQty = seed.baseQty * yearFactor * monthFactor
    const monthCurrent = createMetric(mCurQty, mCurVal, mCurCost)

    // Prior month metrics (SMLY)
    const mPriorVal = seed.baseValue * (yearFactor * 0.85) * monthFactor
    const mPriorCost = seed.baseCost * (yearFactor * 0.85) * monthFactor
    const mPriorQty = seed.baseQty * (yearFactor * 0.88) * monthFactor
    const monthPrior = createMetric(mPriorQty, mPriorVal, mPriorCost)

    const monthComp = createComparison(monthCurrent, monthPrior)

    // YTD metrics (cumulative across targetMonth)
    const ytdCurVal = mCurVal * targetMonth * 0.95
    const ytdCurCost = mCurCost * targetMonth * 0.95
    const ytdCurQty = mCurQty * targetMonth * 0.95
    const ytdCurrent = createMetric(ytdCurQty, ytdCurVal, ytdCurCost)

    const ytdPriorVal = mPriorVal * targetMonth * 0.95
    const ytdPriorCost = mPriorCost * targetMonth * 0.95
    const ytdPriorQty = mPriorQty * targetMonth * 0.95
    const ytdPrior = createMetric(ytdPriorQty, ytdPriorVal, ytdPriorCost)

    const ytdComp = createComparison(ytdCurrent, ytdPrior)

    return {
      id: `${seed.code}-${compKey}`,
      no: idx + 1,
      code: seed.code,
      name: seed.name,
      unit: seed.unit,
      isPush: seed.isPush,
      month: monthComp,
      ytd: ytdComp,
    }
  })

  // Summary row summing all rows
  let sumMCurQty = 0, sumMCurVal = 0, sumMCurCost = 0
  let sumMPriorQty = 0, sumMPriorVal = 0, sumMPriorCost = 0
  let sumYCurQty = 0, sumYCurVal = 0, sumYCurCost = 0
  let sumYPriorQty = 0, sumYPriorVal = 0, sumYPriorCost = 0

  for (const r of rows) {
    sumMCurQty += r.month.current.qty
    sumMCurVal += r.month.current.value
    sumMCurCost += r.month.current.cost
    sumMPriorQty += r.month.prior.qty
    sumMPriorVal += r.month.prior.value
    sumMPriorCost += r.month.prior.cost

    sumYCurQty += r.ytd.current.qty
    sumYCurVal += r.ytd.current.value
    sumYCurCost += r.ytd.current.cost
    sumYPriorQty += r.ytd.prior.qty
    sumYPriorVal += r.ytd.prior.value
    sumYPriorCost += r.ytd.prior.cost
  }

  const sumMonthCurrent = createMetric(sumMCurQty, sumMCurVal, sumMCurCost)
  const sumMonthPrior = createMetric(sumMPriorQty, sumMPriorVal, sumMPriorCost)
  const sumMonthComp = createComparison(sumMonthCurrent, sumMonthPrior)

  const sumYtdCurrent = createMetric(sumYCurQty, sumYCurVal, sumYCurCost)
  const sumYtdPrior = createMetric(sumYPriorQty, sumYPriorVal, sumYPriorCost)
  const sumYtdComp = createComparison(sumYtdCurrent, sumYtdPrior)

  const summaryTotal: MockProductYTDRow = {
    id: 'total-summary',
    no: 0,
    code: 'TOTAL',
    name: 'Total Summary',
    unit: null,
    isPush: false,
    month: sumMonthComp,
    ytd: sumYtdComp,
  }

  return {
    success: true,
    data: {
      company: compKey.toUpperCase(),
      targetYear,
      targetMonth,
      channel,
      availableYears: [2024, 2025, 2026],
      rows,
      summaryTotal,
    },
  }
}
