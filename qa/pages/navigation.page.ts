import { expect, type Locator, type Page } from '@playwright/test'

export type NavigationItem =
  | 'dashboard'
  | 'sale-push'
  | 'reports'
  | 'reports-product-ytd'
  | 'settings'

export class NavigationPage {
  readonly page: Page
  readonly mainNav: Locator
  readonly mobileNav: Locator
  readonly mobileMenuButton: Locator

  readonly navDashboard: Locator
  readonly navSalePush: Locator
  readonly navReports: Locator
  readonly navReportsProductYtd: Locator
  readonly navSettings: Locator

  constructor(page: Page) {
    this.page = page
    this.mainNav = page.locator('nav[aria-label="Main navigation"]')
    this.mobileNav = page.locator('nav[aria-label="Mobile navigation"]')
    this.mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')

    this.navDashboard = this.mainNav.locator('[data-testid="nav-dashboard"]')
    this.navSalePush = this.mainNav.locator('[data-testid="nav-sale-push"]')
    this.navReports = this.mainNav.locator('[data-testid="nav-reports"]')
    this.navReportsProductYtd = this.mainNav.locator('[data-testid="nav-reports-product-ytd"]')
    this.navSettings = this.mainNav.locator('[data-testid="nav-settings"]')
  }

  getNavItem(item: NavigationItem, mobile = false): Locator {
    const parentNav = mobile ? this.mobileNav : this.mainNav
    return parentNav.locator(`[data-testid="nav-${item}"]`)
  }

  async goto(path: string = '/') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const fullPath = cleanPath.startsWith('/tocsalereport')
      ? cleanPath
      : `/tocsalereport${cleanPath}`
    await this.page.goto(fullPath)
  }

  async clickNavItem(item: NavigationItem) {
    await this.getNavItem(item).click()
  }

  async openMobileMenu() {
    await this.mobileMenuButton.click()
    await expect(this.mobileNav).toBeVisible()
  }

  async expectItemActive(item: NavigationItem, mobile = false) {
    const link = this.getNavItem(item, mobile)
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(link).toHaveClass(/text-primary/)
    await expect(link).toHaveClass(/font-semibold/)
    await expect(link).toHaveClass(/bg-primary\/10/)
  }

  async expectItemInactive(item: NavigationItem, mobile = false) {
    const link = this.getNavItem(item, mobile)
    await expect(link).toBeVisible()
    await expect(link).not.toHaveAttribute('aria-current')
    await expect(link).toHaveClass(/text-muted-foreground/)
    await expect(link).not.toHaveClass(/text-primary/)
    await expect(link).not.toHaveClass(/font-semibold/)
  }

  async expectOnlyActiveItem(activeItem: NavigationItem, mobile = false) {
    const allItems: NavigationItem[] = [
      'dashboard',
      'sale-push',
      'reports',
      'reports-product-ytd',
      'settings',
    ]

    for (const item of allItems) {
      if (item === activeItem) {
        await this.expectItemActive(item, mobile)
      } else {
        await this.expectItemInactive(item, mobile)
      }
    }
  }
}
