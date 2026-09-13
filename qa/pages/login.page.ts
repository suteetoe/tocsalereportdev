import { expect, type Locator, type Page } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly container: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorAlert: Locator
  readonly brandTitle: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('[data-testid="login-page"]')
    this.emailInput = page.locator('[data-testid="login-email"]')
    this.passwordInput = page.locator('[data-testid="login-password"]')
    this.submitButton = page.locator('[data-testid="login-submit"]')
    this.errorAlert = page.locator('[role="alert"]')
    this.brandTitle = this.container.locator('p', { hasText: 'TOGROUP Sale Report' })
  }

  async goto(redirectUrl?: string) {
    const path = redirectUrl ? `/tocsalereport/login?redirect=${encodeURIComponent(redirectUrl)}` : '/tocsalereport/login'
    await this.page.goto(path)
    await this.expectLoaded()
  }

  async expectLoaded() {
    await expect(this.container).toBeVisible()
    await expect(this.brandTitle).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async login(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
  }

  async expectErrorMessage(messageSnippet?: string) {
    await expect(this.errorAlert).toBeVisible()
    if (messageSnippet) {
      await expect(this.errorAlert).toContainText(messageSnippet)
    }
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled()
  }
}
