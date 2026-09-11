import { expect, type Locator, type Page } from '@playwright/test'

export type Manufacturer = 'toc' | 'ptoc' | 'tol' | 'top'
export type ProductChannel = 'push' | 'nonpush'
export type ProductMetric = 'value' | 'qty'
export type SortColumn = 'no' | 'code' | 'name' | 'product' | string | number

const channelLabels: Record<ProductChannel, string> = {
  push: 'PUSH',
  nonpush: 'NON PUSH',
}

const metricLabels: Record<ProductMetric, string> = {
  value: 'มูลค่าขาย',
  qty: 'จำนวน',
}

const sortColumnKeywords: Record<string, string> = {
  no: 'No.',
  code: 'Code',
  name: 'Product',
  product: 'Product',
}

export class SalePushProductDetailPage {
  readonly page: Page
  readonly container: Locator
  readonly pageHeading: Locator
  readonly backLink: Locator
  readonly yearSelect: Locator
  readonly channelControls: Locator
  readonly metricControls: Locator
  readonly totalCards: Locator
  readonly table: Locator
  readonly tableRows: Locator
  readonly totalRow: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('[data-testid="sale-push-product-detail-page"]')
    this.pageHeading = this.container.locator('h2')
    this.backLink = this.container.locator('a', { hasText: 'Sale Push' })
    this.yearSelect = this.container.locator('[data-testid="sale-push-detail-year-select"]')
    this.channelControls = this.container.locator('[aria-label="Channel controls"]')
    this.metricControls = this.container.locator('[aria-label="Metric controls"]')
    this.totalCards = this.container.locator('article.rounded-md')
    this.table = this.container.locator('table')
    this.tableRows = this.container.locator('table tbody tr')
    this.totalRow = this.container.locator('table tfoot tr')
  }

  async goto(manufacturer: Manufacturer, year?: number) {
    const url = year
      ? `/tocsalereport/sale-push/${manufacturer}/details?year=${year}`
      : `/tocsalereport/sale-push/${manufacturer}/details`
    await this.page.goto(url)
    await this.expectLoaded()
  }

  async expectLoaded() {
    await expect(this.container).toBeVisible()
    await expect(this.pageHeading).toBeVisible()
    await expect(this.yearSelect).toBeVisible()
    await expect(this.channelControls).toBeVisible()
    await expect(this.metricControls).toBeVisible()
  }

  async selectYear(year: number) {
    await this.yearSelect.selectOption(String(year))
  }

  async selectChannel(channel: ProductChannel) {
    const label = channelLabels[channel]
    const button = this.channelControls.getByRole('button', { name: label, exact: true })
    await button.click()
    await expect(button).toHaveClass(/bg-foreground/)
  }

  async selectMetric(metric: ProductMetric) {
    const label = metricLabels[metric]
    const button = this.metricControls.getByRole('button', { name: label, exact: true })
    await button.click()
    await expect(button).toHaveClass(/bg-foreground/)
  }

  async sortBy(column: SortColumn) {
    const colStr = String(column)
    const keyword = sortColumnKeywords[colStr] ?? colStr
    const headerButton = this.table.locator('thead th button', { hasText: keyword })
    await headerButton.click()
  }

  async getYearHeaders(): Promise<string[]> {
    const buttons = this.table.locator('thead th button')
    const texts = await buttons.allInnerTexts()
    return texts.filter((t) => /^\d{4}$/.test(t.trim()))
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count()
  }

  async getRowTexts(rowIndex: number): Promise<string[]> {
    const row = this.tableRows.nth(rowIndex)
    const cells = row.locator('td')
    return await cells.allInnerTexts()
  }

  async expectTotalRowVisible() {
    await expect(this.totalRow).toBeVisible()
  }

  async getTotalRowTexts(): Promise<string[]> {
    const cells = this.totalRow.locator('td')
    return await cells.allInnerTexts()
  }

  async clickBackToSummary() {
    await this.backLink.click()
  }
}
