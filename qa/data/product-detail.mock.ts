export interface MockProductRow {
  id: string
  no: number
  code: string
  name: string
  unit: string | null
  qty: Record<number, number>
  value: Record<number, number>
}

export interface MockProductGroup {
  key: 'push' | 'nonpush'
  label: string
  items: MockProductRow[]
  total: {
    id: string
    name: string
    unit: string | null
    qty: Record<number, number>
    value: Record<number, number>
  }
}

export interface MockProductDetailReport {
  manufacturer: string
  manufacturerLabel: string
  company: string
  currency: string
  periodLabel: string
  years: number[]
  groups: {
    push: MockProductGroup
    nonpush: MockProductGroup
  }
}

export const mockCompanyDetails: Record<string, MockProductDetailReport> = {
  toc: {
    manufacturer: 'toc',
    manufacturerLabel: 'TOC',
    company: 'บริษัท ที.โอ.เคมีคอลส์ (1979) จำกัด',
    currency: 'THB',
    periodLabel: 'Q1',
    years: [2023, 2024, 2025],
    groups: {
      push: {
        key: 'push',
        label: 'Push',
        items: [
          {
            id: '11T22-0100B',
            no: 1,
            code: '11T22-0100B',
            name: 'โทคาร์ลอล 25 มก.(10X10เม็ด) อลู-อลู',
            unit: 'กล่อง',
            qty: { 2023: 17022, 2024: 17361, 2025: 16770 },
            value: { 2023: 4630430, 2024: 4514945, 2025: 4030250 },
          },
          {
            id: '11T28-0100B',
            no: 2,
            code: '11T28-0100B',
            name: 'โทคาร์ลอล 6.25 มก.(10X10 เม็ด) บลิสเตอร์',
            unit: 'กล่อง',
            qty: { 2023: 38251, 2024: 83340, 2025: 102342 },
            value: { 2023: 7498546, 2024: 14702665, 2025: 16591391 },
          },
          {
            id: '11T23-0030B',
            no: 3,
            code: '11T23-0030B',
            name: 'โทดีซาร์ 16 (3X10 เม็ด) บลิสเตอร์',
            unit: 'กล่อง',
            qty: { 2023: 27251, 2024: 35690, 2025: 36139 },
            value: { 2023: 3542630, 2024: 4639700, 2025: 4698070 },
          },
        ],
        total: {
          id: 'total-push',
          name: 'Total Push',
          unit: null,
          qty: { 2023: 82524, 2024: 136391, 2025: 155251 },
          value: { 2023: 15671606, 2024: 23857310, 2025: 25319711 },
        },
      },
      nonpush: {
        key: 'nonpush',
        label: 'Non Push',
        items: [
          {
            id: '11A01-0100B',
            no: 1,
            code: '11A01-0100B',
            name: 'อะม็อกซีซิลลิน 500 มก.',
            unit: 'กล่อง',
            qty: { 2023: 95000, 2024: 89000, 2025: 92000 },
            value: { 2023: 9500000, 2024: 8900000, 2025: 9200000 },
          },
          {
            id: '11P02-0500B',
            no: 2,
            code: '11P02-0500B',
            name: 'พาราเซตามอล 500 มก.',
            unit: 'กล่อง',
            qty: { 2023: 150000, 2024: 140000, 2025: 135000 },
            value: { 2023: 4500000, 2024: 4200000, 2025: 4050000 },
          },
        ],
        total: {
          id: 'total-nonpush',
          name: 'Total Non Push',
          unit: null,
          qty: { 2023: 245000, 2024: 229000, 2025: 227000 },
          value: { 2023: 14000000, 2024: 13100000, 2025: 13250000 },
        },
      },
    },
  },
  ptoc: {
    manufacturer: 'ptoc',
    manufacturerLabel: 'PTOC',
    company: 'บริษัท พี.ที.โอ.เคมีคอลส์ จำกัด',
    currency: 'THB',
    periodLabel: 'Q1',
    years: [2023, 2024, 2025],
    groups: {
      push: {
        key: 'push',
        label: 'Push',
        items: [
          {
            id: '21P01-0100A',
            no: 1,
            code: '21P01-0100A',
            name: 'พีโทแพรกซิล 40 มก.',
            unit: 'กล่อง',
            qty: { 2023: 25000, 2024: 32000, 2025: 41000 },
            value: { 2023: 6500000, 2024: 8320000, 2025: 10660000 },
          },
          {
            id: '21P02-0200A',
            no: 2,
            code: '21P02-0200A',
            name: 'พีโทโคลพิโดเกรล 75 มก.',
            unit: 'กล่อง',
            qty: { 2023: 42000, 2024: 49000, 2025: 58000 },
            value: { 2023: 9240000, 2024: 10780000, 2025: 12760000 },
          },
        ],
        total: {
          id: 'total-push',
          name: 'Total Push',
          unit: null,
          qty: { 2023: 67000, 2024: 81000, 2025: 99000 },
          value: { 2023: 15740000, 2024: 19100000, 2025: 23420000 },
        },
      },
      nonpush: {
        key: 'nonpush',
        label: 'Non Push',
        items: [
          {
            id: '21N01-0500A',
            no: 1,
            code: '21N01-0500A',
            name: 'พีโทไวตามิน ซี 500 มก.',
            unit: 'ขวด',
            qty: { 2023: 88000, 2024: 76000, 2025: 71000 },
            value: { 2023: 5280000, 2024: 4560000, 2025: 4260000 },
          },
        ],
        total: {
          id: 'total-nonpush',
          name: 'Total Non Push',
          unit: null,
          qty: { 2023: 88000, 2024: 76000, 2025: 71000 },
          value: { 2023: 5280000, 2024: 4560000, 2025: 4260000 },
        },
      },
    },
  },
  tol: {
    manufacturer: 'tol',
    manufacturerLabel: 'TOL',
    company: 'บริษัท ที.โอ.แล็บ จำกัด',
    currency: 'THB',
    periodLabel: 'Q1',
    years: [2023, 2024, 2025],
    groups: {
      push: {
        key: 'push',
        label: 'Push',
        items: [
          {
            id: '31L01-0100C',
            no: 1,
            code: '31L01-0100C',
            name: 'แล็บซีวิท เจลลี่',
            unit: 'ซอง',
            qty: { 2023: 12000, 2024: 19000, 2025: 26000 },
            value: { 2023: 1800000, 2024: 2850000, 2025: 3900000 },
          },
        ],
        total: {
          id: 'total-push',
          name: 'Total Push',
          unit: null,
          qty: { 2023: 12000, 2024: 19000, 2025: 26000 },
          value: { 2023: 1800000, 2024: 2850000, 2025: 3900000 },
        },
      },
      nonpush: {
        key: 'nonpush',
        label: 'Non Push',
        items: [
          {
            id: '31L02-0200C',
            no: 1,
            code: '31L02-0200C',
            name: 'แล็บไบโอติก แคปซูล',
            unit: 'ขวด',
            qty: { 2023: 35000, 2024: 31000, 2025: 29000 },
            value: { 2023: 4200000, 2024: 3720000, 2025: 3480000 },
          },
        ],
        total: {
          id: 'total-nonpush',
          name: 'Total Non Push',
          unit: null,
          qty: { 2023: 35000, 2024: 31000, 2025: 29000 },
          value: { 2023: 4200000, 2024: 3720000, 2025: 3480000 },
        },
      },
    },
  },
  top: {
    manufacturer: 'top',
    manufacturerLabel: 'TOP',
    company: 'บริษัท ที.โอ.ฟาร์มา จำกัด',
    currency: 'THB',
    periodLabel: 'Q1',
    years: [2023, 2024, 2025],
    groups: {
      push: {
        key: 'push',
        label: 'Push',
        items: [
          {
            id: '41P01-0100D',
            no: 1,
            code: '41P01-0100D',
            name: 'ท็อปฟาร์มา เฮิร์บ เอ็กซ์แทรกต์',
            unit: 'ขวด',
            qty: { 2023: 15000, 2024: 22000, 2025: 31000 },
            value: { 2023: 3300000, 2024: 4840000, 2025: 6820000 },
          },
        ],
        total: {
          id: 'total-push',
          name: 'Total Push',
          unit: null,
          qty: { 2023: 15000, 2024: 22000, 2025: 31000 },
          value: { 2023: 3300000, 2024: 4840000, 2025: 6820000 },
        },
      },
      nonpush: {
        key: 'nonpush',
        label: 'Non Push',
        items: [
          {
            id: '41P02-0200D',
            no: 1,
            code: '41P02-0200D',
            name: 'ท็อปฟาร์มา น้ำเกลือปราศจากเชื้อ',
            unit: 'ขวด',
            qty: { 2023: 65000, 2024: 58000, 2025: 52000 },
            value: { 2023: 2600000, 2024: 2320000, 2025: 2080000 },
          },
        ],
        total: {
          id: 'total-nonpush',
          name: 'Total Non Push',
          unit: null,
          qty: { 2023: 65000, 2024: 58000, 2025: 52000 },
          value: { 2023: 2600000, 2024: 2320000, 2025: 2080000 },
        },
      },
    },
  },
}

export function getMockCompanyDetail(
  company: string,
  targetYear = 2025,
): MockProductDetailReport | null {
  const base = mockCompanyDetails[company]
  if (!base) return null
  if (targetYear === 2025) return base

  const years = [targetYear - 2, targetYear - 1, targetYear]

  function patchRow(row: MockProductRow): MockProductRow {
    const qty: Record<number, number> = { ...row.qty }
    const value: Record<number, number> = { ...row.value }
    for (const yr of years) {
      if (qty[yr] === undefined) {
        qty[yr] = Math.round((qty[2023] ?? 10000) * 0.9)
      }
      if (value[yr] === undefined) {
        value[yr] = Math.round((value[2023] ?? 1000000) * 0.9)
      }
    }
    return { ...row, qty, value }
  }

  function patchGroup(grp: MockProductGroup): MockProductGroup {
    return {
      ...grp,
      items: grp.items.map(patchRow),
      total: patchRow(grp.total as unknown as MockProductRow) as unknown as MockProductGroup['total'],
    }
  }

  return {
    ...base,
    years,
    groups: {
      push: patchGroup(base.groups.push),
      nonpush: patchGroup(base.groups.nonpush),
    },
  }
}

