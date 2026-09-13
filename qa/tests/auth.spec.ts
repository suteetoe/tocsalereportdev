import { expect, test } from '../fixtures/test.fixture'

test.describe('Authentication Flow', () => {
  test('ผู้ใช้สามารถเข้าสู่ระบบสำเร็จด้วยข้อมูลที่ถูกต้อง (@smoke, @critical)', async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto()
    await expect(page).toHaveTitle(/TOGROUP Sale Report/)
    await expect(loginPage.brandTitle).toBeVisible()

    await loginPage.fillEmail('admin@toc.co.th')
    await loginPage.fillPassword('password123')
    await loginPage.submit()

    // Upon successful login, the app redirects to the root dashboard
    await expect(page).toHaveURL(/\/tocsalereport\/?$/)
    await expect(page.locator('header')).toContainText('System Administrator')
    await expect(page.getByText('TOGROUP Sale Report').first()).toBeVisible()
  })

  test('ระบบแสดงข้อความผิดพลาดเมื่อกรอกรหัสผ่านไม่ถูกต้อง (@regression)', async ({
    loginPage,
  }) => {
    await loginPage.goto()

    await loginPage.fillEmail('admin@toc.co.th')
    await loginPage.fillPassword('wrong-password')
    await loginPage.submit()

    await loginPage.expectErrorMessage('Invalid email or password.')
  })

  test('ปุ่ม Sign in ถูก disabled เมื่อยังไม่ได้กรอก email หรือ password (@regression)', async ({
    loginPage,
  }) => {
    await loginPage.goto()

    expect(await loginPage.isSubmitDisabled()).toBe(true)

    await loginPage.fillEmail('admin@toc.co.th')
    expect(await loginPage.isSubmitDisabled()).toBe(true)

    await loginPage.fillPassword('password123')
    expect(await loginPage.isSubmitDisabled()).toBe(false)
  })

  test('ผู้ใช้สามารถออกจากระบบได้ (@smoke)', async ({
    authedPage,
  }) => {
    await authedPage.goto('/tocsalereport/')
    await expect(authedPage.locator('[data-testid="logout-button"]')).toBeVisible()

    await authedPage.locator('[data-testid="logout-button"]').click()
    await expect(authedPage).toHaveURL(/\/tocsalereport\/login/)
  })
})
