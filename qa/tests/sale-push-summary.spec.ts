import { expect, test } from '../fixtures/test.fixture'

test.describe('Sale Push Summary Dashboard', () => {
  test('แสดงหน้า Sale Push Summary พร้อม Panels ครบทุกกลุ่ม (ALL, TOC, PTOC, TOL, TOP) (@smoke, @critical)', async ({
    authedSummaryPage,
  }) => {
    await authedSummaryPage.goto()

    await authedSummaryPage.expectLoaded()
    await authedSummaryPage.expectAllPanelsVisible()

    // Verify specific groups exist
    await expect(authedSummaryPage.getPanel('all')).toContainText('ALL')
    await expect(authedSummaryPage.getPanel('toc')).toContainText('TOC')
    await expect(authedSummaryPage.getPanel('ptoc')).toContainText('PTOC')
    await expect(authedSummaryPage.getPanel('tol')).toContainText('TOL')
    await expect(authedSummaryPage.getPanel('top')).toContainText('TOP')
  })

  test('สามารถสลับ Metric ระหว่าง มูลค่าขาย และ จำนวน ได้ (@regression)', async ({
    authedSummaryPage,
  }) => {
    await authedSummaryPage.goto()

    // Initial metric is 'value' (มูลค่าขาย)
    await expect(authedSummaryPage.getPanel('toc')).toContainText('มูลค่าขาย')

    // Switch to 'qty' (จำนวน)
    await authedSummaryPage.selectMetric('qty')
    await expect(authedSummaryPage.getPanel('toc')).toContainText('จำนวน')

    // Switch back to 'value'
    await authedSummaryPage.selectMetric('value')
    await expect(authedSummaryPage.getPanel('toc')).toContainText('มูลค่าขาย')
  })

  test('สามารถสลับ Channel ระหว่าง PUSH, NON PUSH และ รวม ได้ (@regression)', async ({
    authedSummaryPage,
  }) => {
    await authedSummaryPage.goto()

    // Initial channel is 'push' (PUSH)
    await expect(authedSummaryPage.getPanel('toc')).toContainText('PUSH')

    // Switch to 'nonpush' (NON PUSH)
    await authedSummaryPage.selectChannel('nonpush')
    await expect(authedSummaryPage.getPanel('toc')).toContainText('NON PUSH')

    // Switch to 'combo' (รวม)
    await authedSummaryPage.selectChannel('combo')
    await expect(authedSummaryPage.getPanel('toc')).toContainText('รวม')
  })

  test('คลิกลิงก์ Details ของบริษัทนำทางไปยังหน้ารายละเอียดสินค้าได้ถูกต้อง (@smoke, @critical)', async ({
    authedSummaryPage,
    authedPage,
  }) => {
    await authedSummaryPage.goto()

    // Click Details on TOC
    await authedSummaryPage.clickDetailLink('toc')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/sale-push\/toc\/details/)
    await expect(authedPage.locator('h2')).toContainText('TOC PUSH / NON PUSH')
  })

  test('สามารถเลือก Target Year จาก dropdown และ URL อัปเดตพารามิเตอร์ ?year=... (@regression, @critical)', async ({
    authedSummaryPage,
    authedPage,
  }) => {
    await authedSummaryPage.goto()

    // Default target year is 2025
    await expect(authedSummaryPage.yearSelect).toHaveValue('2025')
    await expect(authedSummaryPage.pageTitle).toContainText('PUSH vs NON PUSH 2023-2025')

    // Select 2024
    await authedSummaryPage.selectYear(2024)
    await expect(authedPage).toHaveURL(/year=2024/)
    await expect(authedSummaryPage.yearSelect).toHaveValue('2024')
    await expect(authedSummaryPage.pageTitle).toContainText('PUSH vs NON PUSH 2022-2024')
  })

  test('คลิกลิงก์ Details ของบริษัทส่งต่อ query param ?year=... ไปยังหน้ารายละเอียดสินค้า (@smoke, @critical)', async ({
    authedSummaryPage,
    authedPage,
  }) => {
    await authedSummaryPage.goto()

    // Select 2024
    await authedSummaryPage.selectYear(2024)
    await expect(authedPage).toHaveURL(/year=2024/)

    // Click Details on TOC
    await authedSummaryPage.clickDetailLink('toc')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/sale-push\/toc\/details\?year=2024/)
    await expect(authedPage.locator('h2')).toContainText('TOC PUSH / NON PUSH')
  })
})

