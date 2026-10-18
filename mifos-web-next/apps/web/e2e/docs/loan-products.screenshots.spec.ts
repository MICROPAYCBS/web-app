/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, test, type Page } from '@playwright/test';
import { captureDocsElement, captureDocsScreenshot } from '../helpers/docs-screenshots';
import { waitForPageReady } from '../helpers/interactions';

const LOAN_PRODUCTS_PATH = '/products/loan-products';
const IMG = 'administrators/products';

const CASH_GL_FIELDS = [
  'accounting.fundSourceAccountId',
  'accounting.loanPortfolioAccountId',
  'accounting.transfersInSuspenseAccountId',
  'accounting.interestOnLoanAccountId',
  'accounting.incomeFromFeeAccountId',
  'accounting.incomeFromPenaltyAccountId',
  'accounting.incomeFromRecoveryAccountId',
  'accounting.writeOffAccountId',
  'accounting.overpaymentLiabilityAccountId'
] as const;

test.describe('Docs screenshots — loan products', () => {
  test('captures the create wizard and layout-changing branches', async ({ page }) => {
    test.setTimeout(240_000);

    await page.goto(LOAN_PRODUCTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Loan products' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create loan product' });
    await expect(createLink).toBeVisible();
    await captureDocsScreenshot(page, `${IMG}/loan-products-list.png`);

    await Promise.all([
      page.waitForURL(/\/products\/loan-products\/create(?:\?|$)/, { timeout: 60_000 }),
      createLink.click()
    ]);
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create loan product' })).toBeVisible({
      timeout: 30_000
    });
    await discardResumeBanner(page);
    await expectStep(page, 'Details');

    await fillById(page, 'details.name', 'Business loan');
    await fillById(page, 'details.shortName', 'DEMO');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-create.png`);

    await clickNext(page);
    await expectStep(page, 'Currency');
    await chooseFirstIfEmpty(page, 'currency.currencyCode');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-currency.png`);

    await clickNext(page);
    await expectStep(page, 'Settings');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-settings.png`);

    await captureAdvancedAllocation(page);
    await captureOptionalFeature(page, {
      switchName: /Multi-disburse loan/,
      file: `${IMG}/loan-products-settings-multi-disburse.png`,
      revealed: 'settings.maxTrancheCount',
      values: { 'settings.maxTrancheCount': '3' }
    });
    await captureOptionalFeature(page, {
      switchName: /Hold guarantee funds/,
      file: `${IMG}/loan-products-settings-guarantee.png`,
      revealed: 'settings.mandatoryGuarantee',
      values: {
        'settings.mandatoryGuarantee': '100',
        'settings.minimumGuaranteeFromOwnFunds': '20',
        'settings.minimumGuaranteeFromGuarantor': '80'
      }
    });
    await captureOptionalFeature(page, {
      switchName: /Enable down payment/,
      file: `${IMG}/loan-products-settings-down-payment.png`,
      revealed: 'settings.disbursedAmountPercentageForDownPayment',
      values: { 'settings.disbursedAmountPercentageForDownPayment': '10' }
    });
    await captureOptionalFeature(page, {
      switchName: /Allow variable installments/,
      file: `${IMG}/loan-products-settings-variable-installments.png`,
      revealed: 'settings.minimumGap',
      values: { 'settings.minimumGap': '7', 'settings.maximumGap': '45' }
    });

    await fillById(page, 'settings.overdueDaysForNPA', '90');

    await clickNext(page);
    await expectStep(page, 'Terms');
    await fillIfBlankOrZero(page, 'terms.principal', '1000');
    await fillIfBlank(page, 'terms.interestRatePerPeriod', '2');
    await chooseFirstIfEmpty(page, 'terms.interestRateFrequencyType');
    await chooseFirstIfEmpty(page, 'terms.repaymentFrequencyType');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-terms.png`);

    await clickNext(page);
    await expectStep(page, 'Charges');
    await expect(page.getByText('Select fees and penalties to attach to this product.')).toBeVisible();
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-charges.png`);

    await clickNext(page);
    await expectStep(page, 'Accounting');
    const cash = page.getByRole('radio', { name: /cash/i });
    await expect(cash).toBeVisible();
    if (!(await cash.isChecked())) {
      await cash.check();
    }
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-accounting.png`);

    const periodic = page.getByRole('radio', { name: /periodic/i });
    await periodic.check();
    await expect(page.locator('[id="accounting.receivableInterestAccountId"]')).toBeVisible();
    await expect(page.getByText('Accrual activity posting on due date')).toBeVisible();
    await scrollWizardToTop(page);
    // Extra space so the due-date switch is not covered by the wizard footer.
    await accountingStep(page).evaluate((element) => {
      element.style.paddingBottom = '96px';
    });
    await captureDocsElement(
      page,
      accountingStep(page),
      `${IMG}/loan-products-accounting-accrual.png`
    );
    await cash.check();

    for (const fieldId of CASH_GL_FIELDS) {
      await chooseFirstIfEmpty(page, fieldId);
    }

    await clickNext(page);
    await expectStep(page, 'Mappings');
    await expect(page.getByText('Payment channels', { exact: true })).toBeVisible();
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-mappings.png`);

    await clickNext(page);
    await expectStep(page, 'Preview');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, `${IMG}/loan-products-preview.png`, 1100);
  });
});

function field(page: Page, fieldId: string) {
  return page.locator(`[id="${fieldId}"]`);
}

function sectionCard(page: Page, title: string) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) });
}

function accountingStep(page: Page) {
  return page.locator('div.space-y-6').filter({ has: page.getByRole('radio', { name: /cash/i }) }).first();
}

async function captureAdvancedAllocation(page: Page) {
  const strategyId = 'settings.transactionProcessingStrategyCode';
  await expect(field(page, strategyId)).not.toContainText('Select');
  const previous = await selectButtonText(page, strategyId);
  await chooseMatching(page, strategyId, /advanced payment allocation/i);
  await expect(field(page, 'settings.loanScheduleType')).toContainText(/progressive/i);
  await scrollWizardToTop(page);
  await captureDocsElement(
    page,
    sectionCard(page, 'Repayment settings'),
    `${IMG}/loan-products-settings-advanced-allocation.png`
  );
  await chooseMatching(page, strategyId, new RegExp(escapeRegExp(previous), 'i'));
  await expect(field(page, 'settings.loanScheduleType')).not.toContainText(/progressive/i);
}

async function captureOptionalFeature(
  page: Page,
  options: {
    switchName: RegExp;
    file: string;
    revealed: string;
    values: Record<string, string>;
  }
) {
  await setSwitch(page, options.switchName, true);
  await expect(field(page, options.revealed)).toBeVisible();
  for (const [fieldId, value] of Object.entries(options.values)) {
    await fillById(page, fieldId, value);
  }
  await captureDocsElement(page, sectionCard(page, 'Optional features'), options.file);
  await setSwitch(page, options.switchName, false);
  await expect(field(page, options.revealed)).toHaveCount(0);
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
    await expect.poll(async () => stepLabel(page), { timeout: 12_000 }).not.toBe(before);
  } catch {
    const errors = await page.locator('.text-destructive, [role="alert"]').allInnerTexts();
    throw new Error(`Stuck on ${before}: ${errors.join(' | ') || 'no field error'}`);
  }
}

async function fillById(page: Page, fieldId: string, value: string) {
  await field(page, fieldId).fill(value);
}

async function fillIfBlank(page: Page, fieldId: string, value: string) {
  const input = field(page, fieldId);
  if (!(await input.inputValue()).trim()) {
    await input.fill(value);
  }
}

async function fillIfBlankOrZero(page: Page, fieldId: string, value: string) {
  const raw = (await field(page, fieldId).inputValue()).replace(/,/g, '').trim();
  if (!raw || Number(raw) <= 0) {
    await fillById(page, fieldId, value);
  }
}

async function selectButtonText(page: Page, fieldId: string): Promise<string> {
  const text = await field(page, fieldId).innerText();
  const line = text
    .split('\n')
    .map((part) => part.trim())
    .find(Boolean);
  return line ?? text.trim();
}

async function chooseFirstIfEmpty(page: Page, fieldId: string) {
  const button = field(page, fieldId);
  await button.scrollIntoViewIfNeeded();
  const text = (await button.innerText()).trim();
  if (!text.includes('Select')) {
    return;
  }
  await button.click();
  const item = page.locator('[cmdk-item]').first();
  await expect(item).toBeVisible({ timeout: 15_000 });
  await item.click();
  await expect(page.locator('[cmdk-item]')).toHaveCount(0);
}

async function chooseMatching(page: Page, fieldId: string, pattern: RegExp) {
  await field(page, fieldId).click();
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
  throw new Error(`No option matching ${pattern} for ${fieldId}`);
}

async function setSwitch(page: Page, name: RegExp, on: boolean) {
  const toggle = page.getByRole('switch', { name });
  await toggle.scrollIntoViewIfNeeded();
  const isOn = (await toggle.getAttribute('data-checked')) != null;
  if (isOn !== on) {
    await toggle.click();
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
