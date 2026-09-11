import { expect, test } from '../fixtures/test.fixture'
import type { Manufacturer } from '../pages/sale-push-product-detail.page'

test.describe('Sale Push Product Detail Flow', () => {
  test('แสดงหน้ารายละเอียดสินค้าของ TOC พร้อมตารางสินค้า, ข้อมูลแถว และยอดรวม (@smoke, @critical)', async ({
    authedDetailPage,
  }) => {
    await authedDetailPage.goto('toc')

    // Verify page heading
    await expect(authedDetailPage.pageHeading).toContainText('TOC PUSH / NON PUSH')

    // Verify 3 year total cards are present
    await expect(authedDetailPage.totalCards).toHaveCount(3)

    // Verify table rows exist
    const rowCount = await authedDetailPage.getRowCount()
    expect(rowCount).toBeGreaterThan(0)

    // Check first row has expected content (default sorted by 2025 value descending)
    const firstRowTexts = await authedDetailPage.getRowTexts(0)
    expect(firstRowTexts.length).toBeGreaterThan(3)
    expect(firstRowTexts[1]).toContain('11T28-0100B') // product code
    expect(firstRowTexts[2]).toContain('โทคาร์ลอล 6.25 มก.') // product name

    // Verify total row is displayed
    await authedDetailPage.expectTotalRowVisible()
    const totalRowTexts = await authedDetailPage.getTotalRowTexts()
    expect(totalRowTexts[0]).toContain('Total Push')
  })

  test('สามารถสลับแท็บระหว่าง PUSH และ NON PUSH ในหน้ารายละเอียดสินค้าได้ (@smoke, @regression)', async ({
    authedDetailPage,
  }) => {
    await authedDetailPage.goto('toc')

    // Initially in PUSH tab
    expect(await authedDetailPage.getRowCount()).toBe(3)
    let totalTexts = await authedDetailPage.getTotalRowTexts()
    expect(totalTexts[0]).toContain('Total Push')

    // Switch to NON PUSH tab
    await authedDetailPage.selectChannel('nonpush')
    expect(await authedDetailPage.getRowCount()).toBe(2)

    const firstRowNonPush = await authedDetailPage.getRowTexts(0)
    expect(firstRowNonPush[1]).toContain('11A01-0100B') // non-push product code
    expect(firstRowNonPush[2]).toContain('อะม็อกซีซิลลิน')

    totalTexts = await authedDetailPage.getTotalRowTexts()
    expect(totalTexts[0]).toContain('Total Non Push')

    // Switch back to PUSH tab
    await authedDetailPage.selectChannel('push')
    expect(await authedDetailPage.getRowCount()).toBe(3)
  })

  test('สามารถสลับ Metric ระหว่าง มูลค่าขาย และ จำนวน ได้ (@regression)', async ({
    authedDetailPage,
  }) => {
    await authedDetailPage.goto('toc')

    // Switch to 'qty' (จำนวน)
    await authedDetailPage.selectMetric('qty')
    await expect(authedDetailPage.metricControls.locator('button', { hasText: 'จำนวน' })).toHaveClass(/bg-foreground/)

    // Switch back to 'value' (มูลค่าขาย)
    await authedDetailPage.selectMetric('value')
    await expect(authedDetailPage.metricControls.locator('button', { hasText: 'มูลค่าขาย' })).toHaveClass(/bg-foreground/)
  })

  test('สามารถเรียงลำดับ (Sort) ตารางสินค้าตามคอลัมน์ต่างๆ ได้ (@regression)', async ({
    authedDetailPage,
  }) => {
    await authedDetailPage.goto('toc')

    // Initial order: first row is 11T28-0100B (highest 2025 value)
    const initialFirstRow = await authedDetailPage.getRowTexts(0)
    expect(initialFirstRow[1]).toContain('11T28-0100B')

    // Click sort by Code: initial direction is ascending ('11T22-0100B' comes first)
    await authedDetailPage.sortBy('code')
    const sortedByCodeFirstRow = await authedDetailPage.getRowTexts(0)
    expect(sortedByCodeFirstRow[1]).toContain('11T22-0100B')

    // Click sort by No.: first click sorts descending (No. 3 first)
    await authedDetailPage.sortBy('no')
    const sortedByNoDesc = await authedDetailPage.getRowTexts(0)
    expect(sortedByNoDesc[0]).toContain('3')

    // Second click on No. toggles to ascending (No. 1 first)
    await authedDetailPage.sortBy('no')
    const sortedByNoAsc = await authedDetailPage.getRowTexts(0)
    expect(sortedByNoAsc[0]).toContain('1')
  })

  const manufacturers: { code: Manufacturer; label: string }[] = [
    { code: 'toc', label: 'TOC' },
    { code: 'ptoc', label: 'PTOC' },
    { code: 'tol', label: 'TOL' },
    { code: 'top', label: 'TOP' },
  ]

  for (const { code, label } of manufacturers) {
    test(`แสดงข้อมูลหน้ารายละเอียดสินค้าสำหรับบริษัท ${label} (@regression, @critical)`, async ({
      authedDetailPage,
    }) => {
      await authedDetailPage.goto(code)

      // Verify heading matches company
      await expect(authedDetailPage.pageHeading).toContainText(`${label} PUSH / NON PUSH`)

      // Verify rows and total row exist
      const rowCount = await authedDetailPage.getRowCount()
      expect(rowCount).toBeGreaterThan(0)
      await authedDetailPage.expectTotalRowVisible()
    })
  }

  test('สามารถคลิกลิงก์ย้อนกลับไปยังหน้า Sale Push Summary ได้ (@smoke)', async ({
    authedDetailPage,
    authedPage,
  }) => {
    await authedDetailPage.goto('toc')

    await authedDetailPage.clickBackToSummary()
    await expect(authedPage).toHaveURL(/\/tocsalereport\/sale-push$/)
    await expect(authedPage.locator('h2')).toContainText('PUSH vs NON PUSH 2023-2025')
  })
})
