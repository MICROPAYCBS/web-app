/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, test, type Page } from '@playwright/test';
import {
  E2E_FINERACT_API_URL,
  E2E_FINERACT_TENANT_ID,
  E2E_PASSWORD,
  E2E_USERNAME
} from '../helpers/env';
import { captureDocsElement, captureDocsScreenshot } from '../helpers/docs-screenshots';
import { waitForPageReady } from '../helpers/interactions';

const IMG = 'end-users/clients';
const PRODUCT_NAME = 'Docs handbook loan';
const PRODUCT_SHORT_NAME = 'DOCS';

test.describe('Docs screenshots — apply for a loan', () => {
  test('captures the application wizard and layout-changing branches', async ({ page }) => {
    test.setTimeout(240_000);

    const clientId = String(await seedLoanHandbookFixture());

    await page.goto('/clients');
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

    await page.goto(`/clients/${clientId}/loans`);
    await waitForPageReady(page);
    await expect(page.getByText('Loan accounts', { exact: true })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'New loan account' }).first();
    await expect(createLink, 'The customer must be active so New loan account is offered').toBeVisible();
    await captureDocsScreenshot(page, `${IMG}/apply-loan-list.png`);

    await Promise.all([
      page.waitForURL(new RegExp(`/clients/${clientId}/loans-accounts/create`), { timeout: 60_000 }),
      createLink.click()
    ]);
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Apply for loan' })).toBeVisible({
      timeout: 30_000
    });
    await discardResumeBanner(page);
    await expectStep(page, 'Product');

    await chooseMatchingButton(page, 'Select product', new RegExp(PRODUCT_NAME));
    await expect(page.getByRole('switch', { name: /Top up an existing loan/ })).toBeVisible({
      timeout: 30_000
    });
    const officer = page.getByRole('button', { name: 'Select loan officer' });
    if (await officer.isVisible().catch(() => false)) {
      await chooseFirstButton(page, 'Select loan officer');
    }
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-product.png`);

    await setSwitch(page, /Top up an existing loan/, true);
    await expect(page.getByText('Loan to close')).toBeVisible();
    await captureDocsElement(page, sectionCard(page, 'Top-up'), `${IMG}/apply-loan-topup.png`);
    await setSwitch(page, /Top up an existing loan/, false);
    await expect(page.getByText('Loan to close')).toHaveCount(0);

    await clickNext(page);
    await expectStep(page, 'Terms');
    await fillIfBlankOrZero(page, 'loan-principal', '1000');
    await fillIfBlankOrZero(page, 'loan-term-frequency', '12');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-terms.png`, 1200);

    const defaultsTab = page.getByRole('tab', { name: 'Product defaults' });
    await expect(defaultsTab).toBeVisible();
    await defaultsTab.click();
    await expect(page.getByText(/Defaults and limits from/)).toBeVisible();
    await captureDocsScreenshot(page, `${IMG}/apply-loan-terms-defaults.png`, 1200);
    await page.getByRole('tab', { name: 'Application terms' }).click();

    const downPayment = sectionCard(page, 'Down payment');
    await expect(downPayment).toBeVisible();
    await captureDocsElement(page, downPayment, `${IMG}/apply-loan-terms-down-payment.png`);

    await clickNext(page);
    await expectStep(page, 'Interest');
    await fillIfBlankOrZero(page, 'loan-interest-rate', '2');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-interest.png`, 1100);
    await captureDocsElement(
      page,
      sectionCard(page, 'Calculation & repayment'),
      `${IMG}/apply-loan-interest-calculation.png`
    );

    await clickNext(page);
    await expectStep(page, 'Charges');
    await expect(page.getByText(/fees and penalties|charges/i).first()).toBeVisible();
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-charges.png`);

    await clickNext(page);
    await expectStep(page, 'Schedule');
    await expect(page.getByRole('columnheader', { name: 'Due date' })).toBeVisible({
      timeout: 60_000
    });
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-schedule.png`, 1100);

    await clickNext(page);
    await expectStep(page, 'Security');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-security.png`);

    await page.getByRole('button', { name: 'Add guarantor' }).click();
    await expect(page.getByRole('button', { name: 'CUSTOMER' })).toBeVisible();
    await captureDocsElement(
      page,
      sectionCard(page, 'Guarantors'),
      `${IMG}/apply-loan-guarantor-customer.png`
    );
    await chooseMatchingButton(page, 'CUSTOMER', /^EXTERNAL$/);
    await page.locator('[id="guarantor-firstname-0"]').fill('Amina');
    await page.locator('[id="guarantor-lastname-0"]').fill('Okello');
    await page.locator('[id="guarantor-national-id-0"]').fill('CM00000000');
    await captureDocsElement(
      page,
      sectionCard(page, 'Guarantors'),
      `${IMG}/apply-loan-guarantor-external.png`
    );
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('button', { name: 'Add guarantor' })).toBeVisible();

    await clickNext(page);
    await expectStep(page, 'Payout');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-payout.png`);

    await clickNext(page);
    await expectStep(page, 'Preview');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/apply-loan-preview.png`, 1100);
  });
});

function sectionCard(page: Page, title: string) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) });
}

async function scrollWizardToTop(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const element of document.querySelectorAll('*')) {
      if (element instanceof HTMLElement && element.scrollTop > 0) {
        element.scrollTop = 0;
      }
    }
  });
}

async function discardResumeBanner(page: Page) {
  const discard = page.getByRole('button', { name: 'Discard' });
  if (await discard.isVisible().catch(() => false)) {
    await discard.click();
  }
}

async function stepLabel(page: Page): Promise<string> {
  const text = await page.locator('button[aria-current="step"]').first().innerText();
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line !== 'Needs attention' && !/^\d+$/.test(line));
  return lines[lines.length - 1] ?? text.trim();
}

async function expectStep(page: Page, label: string) {
  await expect.poll(async () => stepLabel(page), { timeout: 20_000 }).toBe(label);
}

async function clickNext(page: Page) {
  const next = page.getByRole('button', { name: 'Next', exact: true });
  const retry = page.getByRole('button', { name: 'Try again' });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
  }
  await expect(next).toBeEnabled({ timeout: 30_000 });
  const before = await stepLabel(page);
  await next.click();
  try {
    await expect.poll(async () => stepLabel(page), { timeout: 20_000 }).not.toBe(before);
  } catch {
    const errors = await page.locator('.text-destructive, [role="alert"]').allInnerTexts();
    throw new Error(`Stuck on ${before}: ${errors.join(' | ') || 'no field error'}`);
  }
}

async function fillIfBlankOrZero(page: Page, fieldId: string, value: string) {
  const input = page.locator(`[id="${fieldId}"]`);
  const raw = (await input.inputValue()).replace(/,/g, '').trim();
  if (!raw || Number(raw) <= 0) {
    await input.fill(value);
  }
}

async function chooseFirstButton(page: Page, name: string | RegExp) {
  await chooseMatchingButton(page, name, /.*/);
}

async function chooseMatchingButton(page: Page, name: string | RegExp, pattern: RegExp) {
  await page.getByRole('button', { name }).first().click();
  const items = page.locator('[cmdk-item]');
  await expect(items.first()).toBeVisible({ timeout: 15_000 });
  const count = await items.count();
  for (let index = 0; index < count; index += 1) {
    const text = (await items.nth(index).innerText()).trim();
    if (pattern.test(text)) {
      await items.nth(index).click();
      await expect(page.locator('[cmdk-item]')).toHaveCount(0);
      return;
    }
  }
  throw new Error(`No option matching ${pattern}`);
}

function fineractToday(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

async function fineract(path: string, init: RequestInit = {}): Promise<unknown> {
  const authorization = Buffer.from(`${E2E_USERNAME}:${E2E_PASSWORD}`).toString('base64');
  const response = await fetch(`${E2E_FINERACT_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${authorization}`,
      'Fineract-Platform-TenantId': E2E_FINERACT_TENANT_ID,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed (${response.status}): ${text}`);
  }
  return body;
}

function resourceId(body: unknown): number {
  if (body && typeof body === 'object' && 'resourceId' in body) {
    const id = Number((body as { resourceId?: unknown }).resourceId);
    if (Number.isFinite(id) && id > 0) {
      return id;
    }
  }
  throw new Error('Response did not include a resource id');
}

async function seedLoanHandbookFixture(): Promise<number> {
  const offices = (await fineract('/offices')) as Array<{ id?: number }>;
  const officeId = offices.find((office) => office.id != null)?.id;
  if (officeId == null) {
    throw new Error('No office is available to attach the handbook customer');
  }

  const staff = (await fineract('/staff')) as Array<{ id?: number; isLoanOfficer?: boolean }>;
  if (!staff.some((member) => member.isLoanOfficer && member.id != null)) {
    const today = fineractToday();
    await fineract('/staff', {
      method: 'POST',
      body: JSON.stringify({
        officeId,
        firstname: 'Sam',
        lastname: 'Officer',
        isLoanOfficer: true,
        joiningDate: today,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en'
      })
    });
  }

  const template = (await fineract('/loanproducts/template')) as {
    currencyOptions?: Array<{ code?: string }>;
    transactionProcessingStrategyOptions?: Array<{ code?: string }>;
  };
  const currencyCode = template.currencyOptions?.find((option) => option.code)?.code ?? 'USD';
  const strategyCode = template.transactionProcessingStrategyOptions?.find((option) => option.code)
    ?.code;
  if (!strategyCode) {
    throw new Error('Loan product template has no repayment strategy');
  }

  const products = (await fineract('/loanproducts')) as Array<{ shortName?: string }>;
  if (!products.some((product) => product.shortName === PRODUCT_SHORT_NAME)) {
    await fineract('/loanproducts', {
      method: 'POST',
      body: JSON.stringify({
        name: PRODUCT_NAME,
        shortName: PRODUCT_SHORT_NAME,
        currencyCode,
        digitsAfterDecimal: '2',
        principal: '1000.00',
        minPrincipal: '100.00',
        maxPrincipal: '100000.00',
        numberOfRepayments: '12',
        minNumberOfRepayments: '1',
        maxNumberOfRepayments: '60',
        repaymentEvery: '1',
        repaymentFrequencyType: '2',
        interestRatePerPeriod: '2',
        minInterestRatePerPeriod: '0',
        maxInterestRatePerPeriod: '30',
        interestRateFrequencyType: '2',
        amortizationType: '1',
        interestType: '0',
        interestCalculationPeriodType: '1',
        transactionProcessingStrategyCode: strategyCode,
        daysInYearType: '1',
        daysInMonthType: '1',
        accountingRule: '1',
        isInterestRecalculationEnabled: false,
        canUseForTopup: true,
        enableDownPayment: true,
        disbursedAmountPercentageForDownPayment: '10',
        enableAutoRepaymentForDownPayment: false,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy'
      })
    });
  }

  const clients = (await fineract('/clients?limit=50')) as {
    pageItems?: Array<{ id?: number; active?: boolean }>;
  };
  const existing = clients.pageItems?.find((client) => client.active === true && client.id != null);
  if (existing?.id != null) {
    return existing.id;
  }

  const today = fineractToday();
  const created = await fineract('/clients', {
    method: 'POST',
    body: JSON.stringify({
      officeId,
      firstname: 'Amina',
      lastname: 'Demo',
      legalFormId: 1,
      active: true,
      activationDate: today,
      submittedOnDate: today,
      dateFormat: 'dd MMMM yyyy',
      locale: 'en'
    })
  });
  return resourceId(created);
}

async function setSwitch(page: Page, name: RegExp, on: boolean) {
  const toggle = page.getByRole('switch', { name });
  await toggle.scrollIntoViewIfNeeded();
  const isOn = (await toggle.getAttribute('data-checked')) != null;
  if (isOn !== on) {
    await toggle.click();
  }
}
