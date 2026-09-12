import { expect, test } from '../fixtures/test.fixture'

test.describe('Sale by Product (YTD) Report Flow', () => {
  test('แสดงหน้ารายงาน Sale by Product (YTD) พร้อมฟิลเตอร์เริ่มต้น, KPI Cards และตารางยอดขาย (@smoke, @critical)', async ({
    authedYTDPage,
    authedPage,
  }) => {
    await authedYTDPage.goto()

    // Page title and breadcrumb verification
    await authedYTDPage.expectLoaded()
    await expect(authedYTDPage.container.locator('h1')).toContainText('รายงานยอดขายตามสินค้า YTD')
    await expect(authedYTDPage.breadcrumbReportsLink).toBeVisible()

    // Default company is TOC
    const tocTab = authedYTDPage.getCompanyTab('toc')
    await expect(tocTab).toHaveClass(/bg-primary/)

    // Default channel filter is All
    const allChannelBtn = authedYTDPage.getChannelButton('all')
    await expect(allChannelBtn).toHaveClass(/bg-foreground/)

    // Default metric view is Revenue (value)
    const valMetricBtn = authedYTDPage.getMetricButton('value')
    await expect(valMetricBtn).toHaveClass(/bg-primary/)

    // KPI Summary cards rendered
    await authedYTDPage.expectKpiCardsVisible()
    await expect(authedYTDPage.kpiSummaryCards).toContainText('ยอดขายเดือนนี้')
    await expect(authedYTDPage.kpiSummaryCards).toContainText('ยอดขายสะสม YTD')
    await expect(authedYTDPage.kpiSummaryCards).toContainText('กำไรขั้นต้น')

    // Table rows rendered
    const rowCount = await authedYTDPage.getRowCount()
    expect(rowCount).toBeGreaterThan(0)

    // Verify first row contains TOC product info
    const firstRow = await authedYTDPage.getRowTexts(0)
    expect(firstRow[1]).toContain('11T22-0100B')
    expect(firstRow[2]).toContain('โทคาร์ลอล 25 มก.')

    // Total summary row rendered
    await authedYTDPage.expectTotalRowVisible()
    const totalRow = await authedYTDPage.getTotalRowTexts()
    expect(totalRow[0]).toContain('รวมทั้งหมด')

    // Verify growth indicators (% formatted string with + or - or %)
    await expect(authedYTDPage.table).toContainText('%')
  })

  test('สามารถนำทางจากหน้ารายงานทั้งหมด (Reports) มายังหน้า Sale by Product (YTD) ได้ (@smoke, @critical)', async ({
    authedPage,
    authedYTDPage,
  }) => {
    await authedPage.goto('/tocsalereport/reports')

    const reportCard = authedPage.locator('[data-testid="report-card-product-ytd"]')
    await expect(reportCard).toBeVisible()
    await expect(reportCard).toContainText('Sale by Product (YTD)')

    await reportCard.click()
    await expect(authedPage).toHaveURL(/\/tocsalereport\/reports\/product-ytd/)
    await authedYTDPage.expectLoaded()
  })

  test('สามารถสลับแท็บบริษัท (TOC, PTOC, TOL, TOP) และข้อมูลสินค้าในตารางจะอัปเดตตามบริษัท (@regression, @critical)', async ({
    authedYTDPage,
    authedPage,
  }) => {
    await authedYTDPage.goto()

    // Initial is TOC
    await authedYTDPage.expectFirstRowToContain('11T22-0100B')

    // Switch to PTOC
    await authedYTDPage.selectCompany('ptoc')
    await expect(authedPage).toHaveURL(/company=ptoc/)
    await authedYTDPage.expectFirstRowToContain('21T10-0100B')
    await authedYTDPage.expectFirstRowToContain('พีทีโอซี-การ์ด')

    // Switch to TOL
    await authedYTDPage.selectCompany('tol')
    await expect(authedPage).toHaveURL(/company=tol/)
    await authedYTDPage.expectFirstRowToContain('31L01-0100B')
    await authedYTDPage.expectFirstRowToContain('ทีโอแอล-มัยซิน')

    // Switch to TOP
    await authedYTDPage.selectCompany('top')
    await expect(authedPage).toHaveURL(/company=top/)
    await authedYTDPage.expectFirstRowToContain('41P01-0100B')
    await authedYTDPage.expectFirstRowToContain('ท็อป-วิตามินซี')

    // Switch back to TOC
    await authedYTDPage.selectCompany('toc')
    await expect(authedPage).toHaveURL(/company=toc/)
    await authedYTDPage.expectFirstRowToContain('11T22-0100B')
  })

  test('สามารถเลือก Year และ Month จาก dropdown และหัวตารางรวมถึง URL อัปเดตตามที่เลือก (@regression, @critical)', async ({
    authedYTDPage,
    authedPage,
  }) => {
    await authedYTDPage.goto()

    // Default target year is 2025 and month is 6 (มิถุนายน 2025)
    await expect(authedYTDPage.yearSelect).toHaveValue('2025')
    await expect(authedYTDPage.monthSelect).toHaveValue('6')
    await expect(authedYTDPage.table).toContainText('มิถุนายน 2025')
    await expect(authedYTDPage.table).toContainText('SMLY (มิถุนายน 2024)')

    // Select Year 2024
    await authedYTDPage.selectYear(2024)
    await expect(authedPage).toHaveURL(/year=2024/)
    await expect(authedYTDPage.yearSelect).toHaveValue('2024')
    await expect(authedYTDPage.table).toContainText('มิถุนายน 2024')
    await expect(authedYTDPage.table).toContainText('SMLY (มิถุนายน 2023)')

    // Select Month 10 (ตุลาคม)
    await authedYTDPage.selectMonth(10)
    await expect(authedPage).toHaveURL(/month=10/)
    await expect(authedYTDPage.monthSelect).toHaveValue('10')
    await expect(authedYTDPage.table).toContainText('ตุลาคม 2024')
    await expect(authedYTDPage.table).toContainText('SMLY (ตุลาคม 2023)')
  })

  test('สามารถกรองช่องทางขาย (Channel: All, Push, Non-Push) ได้ถูกต้อง (@regression)', async ({
    authedYTDPage,
    authedPage,
  }) => {
    await authedYTDPage.goto()

    // All channels: 4 rows for TOC
    await authedYTDPage.expectRowCount(4)

    // Filter by Push
    await authedYTDPage.selectChannel('push')
    await expect(authedPage).toHaveURL(/channel=push/)
    await authedYTDPage.expectRowCount(2)

    // Both push rows must contain PUSH badge
    for (let i = 0; i < 2; i++) {
      const rowTexts = await authedYTDPage.getRowTexts(i)
      expect(rowTexts[2]).toContain('PUSH')
    }

    // Filter by Non-Push
    await authedYTDPage.selectChannel('nonpush')
    await expect(authedPage).toHaveURL(/channel=nonpush/)
    await authedYTDPage.expectRowCount(2)
    await authedYTDPage.expectFirstRowToContain('อะม็อกซีซิลลิน')

    // Non-push rows must not contain PUSH badge
    for (let i = 0; i < 2; i++) {
      const rowTexts = await authedYTDPage.getRowTexts(i)
      expect(rowTexts[2]).not.toContain('PUSH')
    }

    // Switch back to All
    await authedYTDPage.selectChannel('all')
    await expect(authedPage).toHaveURL(/channel=all/)
    await authedYTDPage.expectRowCount(4)
  })

  test('สามารถสลับมุมมอง Metric View (ยอดขาย, จำนวน, กำไรขั้นต้น) ได้ถูกต้อง (@regression)', async ({
    authedYTDPage,
    authedPage,
  }) => {
    await authedYTDPage.goto()

    // Default is Revenue (value)
    await expect(authedYTDPage.getMetricButton('value')).toHaveClass(/bg-primary/)

    // Switch to Quantity (qty)
    await authedYTDPage.selectMetricView('qty')
    await expect(authedPage).toHaveURL(/metricView=qty/)
    await expect(authedYTDPage.getMetricButton('qty')).toHaveClass(/bg-primary/)

    // Switch to Gross Profit (profit)
    await authedYTDPage.selectMetricView('profit')
    await expect(authedPage).toHaveURL(/metricView=profit/)
    await expect(authedYTDPage.getMetricButton('profit')).toHaveClass(/bg-primary/)

    // In profit view, margin percentage (% Margin) is shown in summary total and table cells
    await expect(authedYTDPage.totalRow).toContainText('%')

    // Switch back to Revenue
    await authedYTDPage.selectMetricView('value')
    await expect(authedPage).toHaveURL(/metricView=value/)
    await expect(authedYTDPage.getMetricButton('value')).toHaveClass(/bg-primary/)
  })

  test('สามารถเปิดหน้ารายงานผ่าน URL พร้อม Query Parameters ได้โดยตรง (@regression)', async ({
    authedYTDPage,
    authedPage,
  }) => {
    await authedYTDPage.goto({
      company: 'ptoc',
      year: 2024,
      month: 10,
      channel: 'push',
      metricView: 'profit',
    })

    // Verify company tab
    await expect(authedYTDPage.getCompanyTab('ptoc')).toHaveClass(/bg-primary/)

    // Verify selectors
    await expect(authedYTDPage.yearSelect).toHaveValue('2024')
    await expect(authedYTDPage.monthSelect).toHaveValue('10')

    // Verify channel button
    await expect(authedYTDPage.getChannelButton('push')).toHaveClass(/bg-foreground/)

    // Verify metric button
    await expect(authedYTDPage.getMetricButton('profit')).toHaveClass(/bg-primary/)

    // Verify table content for PTOC push
    const rowCount = await authedYTDPage.getRowCount()
    expect(rowCount).toBe(1)
    const row = await authedYTDPage.getRowTexts(0)
    expect(row[1]).toContain('21T10-0100B')
    expect(row[2]).toContain('พีทีโอซี-การ์ด')
    expect(row[2]).toContain('PUSH')
  })
})
