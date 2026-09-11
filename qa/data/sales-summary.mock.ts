interface QuarterRecord {
  quarter: string
  values: Record<number, number>
  growth: {
    from2023To2024: number
    from2024To2025: number
  }
}

interface SeriesRecord {
  group: string
  channel: string
  metric: string
  quarters: QuarterRecord[]
}

function createQuarter(quarter: string, v2023: number, v2024: number, v2025: number): QuarterRecord {
  return {
    quarter,
    values: {
      2023: v2023,
      2024: v2024,
      2025: v2025,
    },
    growth: {
      from2023To2024: v2023 > 0 ? (v2024 - v2023) / v2023 : 0,
      from2024To2025: v2024 > 0 ? (v2025 - v2024) / v2024 : 0,
    },
  }
}

function createSeries(group: string, channel: string, metric: string, multiplier: number): SeriesRecord {
  const base = metric === 'value' ? 50_000_000 * multiplier : 150_000 * multiplier
  return {
    group,
    channel,
    metric,
    quarters: [
      createQuarter('Q1', base, base * 1.15, base * 1.25),
      createQuarter('Q2', base * 1.05, base * 1.18, base * 1.3),
      createQuarter('Q3', base * 0.95, base * 1.1, base * 1.22),
      createQuarter('Q4', base * 1.2, base * 1.35, base * 1.45),
    ],
  }
}

function createPanel(group: string, multiplier: number) {
  return {
    group,
    series: {
      push: {
        value: createSeries(group, 'push', 'value', multiplier),
        qty: createSeries(group, 'push', 'qty', multiplier),
      },
      nonpush: {
        value: createSeries(group, 'nonpush', 'value', multiplier * 2.5),
        qty: createSeries(group, 'nonpush', 'qty', multiplier * 5),
      },
      combo: {
        value: createSeries(group, 'combo', 'value', multiplier * 3.5),
        qty: createSeries(group, 'combo', 'qty', multiplier * 6),
      },
    },
  }
}

export const mockSalePushSummaryResponse = {
  success: true,
  data: {
    panels: {
      all: createPanel('all', 4.0),
      toc: createPanel('toc', 1.0),
      ptoc: createPanel('ptoc', 1.2),
      tol: createPanel('tol', 0.8),
      top: createPanel('top', 1.0),
    },
  },
}
