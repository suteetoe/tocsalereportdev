import { expect, test } from '../fixtures/test.fixture'

test.describe('Sidebar Navigation Active State', () => {
  test('แสดงสถานะ active บนเมนู Dashboard เมื่ออยู่ที่หน้าหลัก (/) (@smoke, @critical)', async ({
    authedNavigationPage,
    authedPage,
  }) => {
    await authedNavigationPage.goto('/')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/?$/)

    await authedNavigationPage.expectOnlyActiveItem('dashboard')
  })

  test('แสดงสถานะ active บนเมนู Sale Push เมื่ออยู่ที่หน้า /sale-push (@smoke, @critical)', async ({
    authedNavigationPage,
    authedPage,
  }) => {
    await authedNavigationPage.goto('/sale-push')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/sale-push/)

    await authedNavigationPage.expectOnlyActiveItem('sale-push')
  })

  test('แสดงสถานะ active บนเมนู Sale Push เมื่อเข้าสู่หน้าย่อย /sale-push/toc/details (@smoke, @critical)', async ({
    authedNavigationPage,
    authedPage,
  }) => {
    await authedNavigationPage.goto('/sale-push/toc/details')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/sale-push\/toc\/details/)

    await authedNavigationPage.expectOnlyActiveItem('sale-push')
  })

  test('แสดงสถานะ active บนเมนู Reports และไม่ไฮไลต์ Product YTD เมื่ออยู่ที่หน้า /reports (@smoke, @critical)', async ({
    authedNavigationPage,
    authedPage,
  }) => {
    await authedNavigationPage.goto('/reports')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/reports/)

    await authedNavigationPage.expectOnlyActiveItem('reports')
    await authedNavigationPage.expectItemActive('reports')
    await authedNavigationPage.expectItemInactive('reports-product-ytd')
  })

  test('แสดงสถานะ active บนเมนู Product YTD และไม่ไฮไลต์ Reports เมื่ออยู่ที่หน้า /reports/product-ytd (@smoke, @critical)', async ({
    authedNavigationPage,
    authedPage,
  }) => {
    await authedNavigationPage.goto('/reports/product-ytd')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/reports\/product-ytd/)

    await authedNavigationPage.expectOnlyActiveItem('reports-product-ytd')
    await authedNavigationPage.expectItemActive('reports-product-ytd')
    await authedNavigationPage.expectItemInactive('reports')
  })

  test('อัปเดตสถานะ active ของเมนู Sidebar แบบ reactive เมื่อผู้ใช้คลิกนำทางระหว่างหน้า (@regression)', async ({
    authedNavigationPage,
    authedPage,
  }) => {
    // Start at Dashboard
    await authedNavigationPage.goto('/')
    await authedNavigationPage.expectOnlyActiveItem('dashboard')

    // Click Sale Push
    await authedNavigationPage.clickNavItem('sale-push')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/sale-push/)
    await authedNavigationPage.expectOnlyActiveItem('sale-push')

    // Click Reports
    await authedNavigationPage.clickNavItem('reports')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/reports/)
    await authedNavigationPage.expectOnlyActiveItem('reports')

    // Click Product YTD
    await authedNavigationPage.clickNavItem('reports-product-ytd')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/reports\/product-ytd/)
    await authedNavigationPage.expectOnlyActiveItem('reports-product-ytd')

    // Click back to Dashboard
    await authedNavigationPage.clickNavItem('dashboard')
    await expect(authedPage).toHaveURL(/\/tocsalereport\/?$/)
    await authedNavigationPage.expectOnlyActiveItem('dashboard')
  })

  test('แสดงสถานะ active บนเมนู Mobile Navigation เมื่อเปิดเมนูบนหน้าจอขนาดเล็ก (@regression)', async ({
    authedNavigationPage,
    authedPage,
  }) => {
    await authedPage.setViewportSize({ width: 375, height: 667 })
    await authedNavigationPage.goto('/sale-push/toc/details')

    await authedNavigationPage.openMobileMenu()
    await authedNavigationPage.expectItemActive('sale-push', true)
    await authedNavigationPage.expectItemInactive('dashboard', true)
    await authedNavigationPage.expectItemInactive('reports', true)
  })
})
