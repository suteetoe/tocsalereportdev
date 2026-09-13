import { test as base, type Page } from '@playwright/test'

import {
  mockAuthUser,
  mockLoginFailureResponse,
  mockLoginSuccessResponse,
  mockLogoutSuccessResponse,
  mockProfileResponse,
} from '../data/auth.mock'
import { getMockCompanyDetail, mockCompanyDetails } from '../data/product-detail.mock'
import { getMockProductYTDResponse } from '../data/product-ytd.mock'
import {
  getMockSalePushSummaryResponse,
  mockSalePushSummaryResponse,
  mockSalePushYearsResponse,
} from '../data/sales-summary.mock'
import {
  LoginPage,
  NavigationPage,
  SaleProductYTDPage,
  SalePushProductDetailPage,
  SalePushSummaryPage,
} from '../pages'


export async function setupApiMocks(page: Page) {
  // Mock login endpoint
  await page.route('**/api/v1/auth/login', async (route) => {
    const request = route.request()
    if (request.method() === 'POST') {
      const postData = request.postDataJSON() as { email?: string; password?: string }
      if (postData?.password === 'wrong-password' || postData?.email === 'wrong@company.com') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify(mockLoginFailureResponse),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLoginSuccessResponse),
      })
      return
    }
    await route.continue()
  })

  // Mock profile me endpoint
  await page.route('**/api/v1/profile/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockProfileResponse),
    })
  })

  // Mock logout endpoint
  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLogoutSuccessResponse),
    })
  })

  // Mock available years endpoint
  await page.route('**/api/v1/sales/push/years', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSalePushYearsResponse),
    })
  })

  // Mock sales push summary endpoint
  await page.route('**/api/v1/sales/push/summary*', async (route) => {
    const url = new URL(route.request().url())
    const yearParam = url.searchParams.get('year')
    const year = yearParam ? Number(yearParam) : 2025
    const response = getMockSalePushSummaryResponse(year)

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })

  // Mock sales push product detail endpoint
  await page.route(/\/sales\/push\/companies\/([^/]+)\/products/, async (route) => {
    const url = route.request().url()
    const match = url.match(/\/sales\/push\/companies\/([^/?]+)\/products/)
    const company = match ? match[1].toLowerCase() : ''

    if (company in mockCompanyDetails) {
      const urlObj = new URL(url)
      const yearParam = urlObj.searchParams.get('year')
      const targetYear = yearParam ? Number(yearParam) : 2025
      const detail = getMockCompanyDetail(company, targetYear)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: detail,
        }),
      })
      return
    }

    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: {
          code: 'invalid_company',
          message: `unsupported company: ${company}`,
        },
      }),
    })
  })

  // Mock sales products YTD endpoint
  await page.route('**/api/v1/sales/products/ytd*', async (route) => {
    const url = new URL(route.request().url())
    const company = url.searchParams.get('company') || 'toc'
    const yearParam = url.searchParams.get('year')
    const monthParam = url.searchParams.get('month')
    const channelParam = url.searchParams.get('channel') || 'all'

    const year = yearParam ? Number(yearParam) : 2025
    const month = monthParam ? Number(monthParam) : 6
    const channel = channelParam

    const response = getMockProductYTDResponse(company, year, month, channel)

    if (!response.success) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

export async function injectAuthSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('toc-sale-report.auth-token', 'mock-access-token-xyz123')
    localStorage.setItem('toc-sale-report.refresh-token', 'mock-refresh-token-abc456')
    localStorage.setItem('toc-sale-report.token-type', 'Bearer')
    localStorage.setItem('toc-sale-report.authenticated-at', new Date().toISOString())
  })
}

type TestFixtures = {
  loginPage: LoginPage
  summaryPage: SalePushSummaryPage
  detailPage: SalePushProductDetailPage
  productYTDPage: SaleProductYTDPage
  navigationPage: NavigationPage
  authedPage: Page
  authedSummaryPage: SalePushSummaryPage
  authedDetailPage: SalePushProductDetailPage
  authedYTDPage: SaleProductYTDPage
  authedNavigationPage: NavigationPage
}

export const test = base.extend<TestFixtures>({
  page: async ({ page }, use) => {
    await setupApiMocks(page)
    await use(page)
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  summaryPage: async ({ page }, use) => {
    await use(new SalePushSummaryPage(page))
  },

  detailPage: async ({ page }, use) => {
    await use(new SalePushProductDetailPage(page))
  },

  productYTDPage: async ({ page }, use) => {
    await use(new SaleProductYTDPage(page))
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page))
  },

  authedPage: async ({ page }, use) => {
    await injectAuthSession(page)
    await use(page)
  },

  authedSummaryPage: async ({ authedPage }, use) => {
    await use(new SalePushSummaryPage(authedPage))
  },

  authedDetailPage: async ({ authedPage }, use) => {
    await use(new SalePushProductDetailPage(authedPage))
  },

  authedYTDPage: async ({ authedPage }, use) => {
    await use(new SaleProductYTDPage(authedPage))
  },

  authedNavigationPage: async ({ authedPage }, use) => {
    await use(new NavigationPage(authedPage))
  },
})

export { expect } from '@playwright/test'
