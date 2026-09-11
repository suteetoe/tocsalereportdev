import { expect, type Locator, type Page } from '@playwright/test'

export type SalePushMetric = 'value' | 'qty'
export type SalePushChannel = 'push' | 'nonpush' | 'combo'
export type SalePushGroup = 'all' | 'toc' | 'ptoc' | 'tol' | 'top'

const metricLabels: Record<SalePushMetric, string> = {
  value: 'มูลค่าขาย',
  qty: 'จำนวน',
}

const channelLabels: Record<SalePushChannel, string> = {
  push: 'PUSH',
  nonpush: 'NON PUSH',
  combo: 'รวม',
}

export class SalePushSummaryPage {
  readonly page: Page
  readonly container: Locator
  readonly pageTitle: Locator
  readonly metricControls: Locator
  readonly channelControls: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('[data-testid="sale-push-page"]')
    this.pageTitle = page.locator('h2', { hasText: 'PUSH vs NON PUSH 2023-2025' })
    this.metricControls = page.locator('[aria-label="Metric controls"]')
    this.channelControls = page.locator('[aria-label="Channel controls"]')
  }

  async goto() {
    await this.page.goto('/tocsalereport/sale-push')
    await this.expectLoaded()
  }

  async expectLoaded() {
    await expect(this.container).toBeVisible()
    await expect(this.pageTitle).toBeVisible()
    await expect(this.metricControls).toBeVisible()
    await expect(this.channelControls).toBeVisible()
  }

  getPanel(group: SalePushGroup): Locator {
    return this.page.locator(`[data-testid="sale-push-panel-${group}"]`)
  }

  getDetailLink(group: Exclude<SalePushGroup, 'all'>): Locator {
    return this.page.locator(`[data-testid="sale-push-detail-link-${group}"]`)
  }

  async expectAllPanelsVisible() {
    const groups: SalePushGroup[] = ['all', 'toc', 'ptoc', 'tol', 'top']
    for (const group of groups) {
      await expect(this.getPanel(group)).toBeVisible()
    }
  }

  async selectMetric(metric: SalePushMetric) {
    const label = metricLabels[metric]
    const button = this.metricControls.getByRole('button', { name: label, exact: true })
    await button.click()
    // Wait for the active class (bg-foreground)
    await expect(button).toHaveClass(/bg-foreground/)
  }

  async selectChannel(channel: SalePushChannel) {
    const label = channelLabels[channel]
    const button = this.channelControls.getByRole('button', { name: label, exact: true })
    await button.click()
    // Wait for the active class (bg-foreground)
    await expect(button).toHaveClass(/bg-foreground/)
  }

  async clickDetailLink(group: Exclude<SalePushGroup, 'all'>) {
    const link = this.getDetailLink(group)
    await expect(link).toBeVisible()
    await link.click()
  }
}
