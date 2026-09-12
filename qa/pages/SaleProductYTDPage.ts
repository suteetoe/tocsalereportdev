import { expect, type Locator, type Page } from '@playwright/test'

export type CompanyTab = 'toc' | 'ptoc' | 'tol' | 'top'
export type ChannelFilter = 'all' | 'push' | 'nonpush'
export type MetricView = 'value' | 'qty' | 'profit'

export class SaleProductYTDPage {
  readonly page: Page
  readonly container: Locator
  readonly pageTitle: Locator
  readonly breadcrumbReportsLink: Locator
  readonly refreshButton: Locator
  readonly companyTabs: Locator
  readonly yearSelect: Locator
  readonly monthSelect: Locator
  readonly kpiSummaryCards: Locator
  readonly tableWrapper: Locator
  readonly table: Locator
  readonly tableRows: Locator
  readonly totalRow: Locator
  readonly loadingSkeleton: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('[data-testid="sale-product-ytd-page"]')
    this.pageTitle = this.container.locator('h1')
    this.breadcrumbReportsLink = this.container.locator('a', { hasText: 'รายงานทั้งหมด' })
    this.refreshButton = page.locator('[data-testid="refresh-button"]')
    this.companyTabs = page.locator('[data-testid="company-tabs"]')
    this.yearSelect = page.locator('[data-testid="year-select"]')
    this.monthSelect = page.locator('[data-testid="month-select"]')
    this.kpiSummaryCards = page.locator('[data-testid="kpi-summary-cards"]')
    this.tableWrapper = page.locator('[data-testid="product-ytd-table-wrapper"]')
    this.table = page.locator('[data-testid="product-ytd-table"]')
    this.tableRows = page.locator('[data-testid="product-ytd-row"]')
    this.totalRow = page.locator('[data-testid="product-ytd-total-row"]')
    this.loadingSkeleton = page.locator('[data-testid="loading-skeleton"]')
    this.errorAlert = page.locator('[data-testid="error-alert"]')
  }

  async goto(params?: {
    company?: CompanyTab
    year?: number
    month?: number
    channel?: ChannelFilter
    metricView?: MetricView
  }) {
    const searchParams = new URLSearchParams()
    if (params?.company) searchParams.set('company', params.company)
    if (params?.year) searchParams.set('year', String(params.year))
    if (params?.month) searchParams.set('month', String(params.month))
    if (params?.channel) searchParams.set('channel', params.channel)
    if (params?.metricView) searchParams.set('metricView', params.metricView)

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    await this.page.goto(`/tocsalereport/reports/product-ytd${query}`)
    await this.expectLoaded()
  }

  async expectLoaded() {
    await expect(this.container).toBeVisible()
    await expect(this.pageTitle).toContainText('รายงานยอดขายตามสินค้า YTD')
    await expect(this.yearSelect).toBeVisible()
    await expect(this.monthSelect).toBeVisible()
    await expect(this.table).toBeVisible()
  }

  getCompanyTab(company: CompanyTab): Locator {
    return this.page.locator(`[data-testid="company-tab-${company}"]`)
  }

  getChannelButton(channel: ChannelFilter): Locator {
    return this.page.locator(`[data-testid="channel-filter-${channel}"]`)
  }

  getMetricButton(metric: MetricView): Locator {
    return this.page.locator(`[data-testid="metric-view-${metric}"]`)
  }

  async selectCompany(company: CompanyTab) {
    const tab = this.getCompanyTab(company)
    await tab.click()
    await expect(tab).toHaveClass(/bg-primary/)
  }

  async selectYear(year: number) {
    await this.yearSelect.selectOption(String(year))
  }

  async selectMonth(month: number) {
    await this.monthSelect.selectOption(String(month))
  }

  async selectChannel(channel: ChannelFilter) {
    const button = this.getChannelButton(channel)
    await button.click()
    await expect(button).toHaveClass(/bg-foreground/)
  }

  async selectMetricView(metric: MetricView) {
    const button = this.getMetricButton(metric)
    await button.click()
    await expect(button).toHaveClass(/bg-primary/)
  }

  async refresh() {
    await this.refreshButton.click()
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count()
  }

  async getRowTexts(rowIndex: number): Promise<string[]> {
    const row = this.tableRows.nth(rowIndex)
    const cells = row.locator('td')
    return await cells.allInnerTexts()
  }

  async getTotalRowTexts(): Promise<string[]> {
    const cells = this.totalRow.locator('td')
    return await cells.allInnerTexts()
  }

  async expectFirstRowToContain(text: string) {
    await expect(this.tableRows.first()).toContainText(text)
  }

  async expectRowCount(count: number) {
    await expect(this.tableRows).toHaveCount(count)
  }

  async expectKpiCardsVisible() {
    await expect(this.kpiSummaryCards).toBeVisible()
  }

  async expectTotalRowVisible() {
    await expect(this.totalRow).toBeVisible()
  }
}
