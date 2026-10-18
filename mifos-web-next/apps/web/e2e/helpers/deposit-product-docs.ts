/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, type Page } from '@playwright/test';
import {
  E2E_FINERACT_API_URL,
  E2E_FINERACT_TENANT_ID,
  E2E_PASSWORD,
  E2E_USERNAME
} from './env';
import { captureDocsElement, captureDocsScreenshot } from './docs-screenshots';
import { waitForPageReady } from './interactions';

const IMG = 'administrators/products';

const CASH_GL_FIELDS = [
  'accounting.savingsReferenceAccountId',
  'accounting.savingsControlAccountId',
  'accounting.transfersInSuspenseAccountId',
  'accounting.interestOnSavingsAccountId',
  'accounting.incomeFromFeeAccountId',
  'accounting.incomeFromPenaltyAccountId'
] as const;

export async function seedDepositHandbookGlAccounts(): Promise<void> {
  const existing = (await fineract('/glaccounts')) as unknown[];
  if (Array.isArray(existing) && existing.length > 0) {
    return;
  }

  const assets = await createGl('Assets', '10000', 1, 2);
  const liabilities = await createGl('Liabilities', '20000', 2, 2);
  const income = await createGl('Income', '40000', 4, 2);
  const expenses = await createGl('Expenses', '50000', 5, 2);

  await createGl('Cash', '11100', 1, 1, assets);
  await createGl('Fees receivable', '11400', 1, 1, assets);
  await createGl('Penalties receivable', '11500', 1, 1, assets);
  await createGl('Saving control', '21000', 2, 1, liabilities);
  await createGl('Transfers in suspense', '21100', 2, 1, liabilities);
  await createGl('Interest payable', '21200', 2, 1, liabilities);
  await createGl('Income from fees', '41000', 4, 1, income);
  await createGl('Income from penalties', '42000', 4, 1, income);
  await createGl('Interest on savings', '51000', 5, 1, expenses);
}

export async function captureDepositProductWizard(
  page: Page,
  options: {
    path: string;
    listHeading: string;
    createLinkName: string;
    createHeading: string;
    name: string;
    shortName: string;
    description: string;
    filePrefix: 'fixed-deposit-products' | 'recurring-deposit-products';
    /** Lock-in, pre-closure, tax, accrual, and mappings. Shared images, captured once. */
    captureSharedBranches: boolean;
  }
): Promise<void> {
  await seedDepositHandbookGlAccounts();

  await page.goto(options.path);
  await waitForPageReady(page);
  await expect(page.getByRole('heading', { name: options.listHeading })).toBeVisible();
  const createLink = page.getByRole('link', { name: options.createLinkName });
  await expect(createLink).toBeVisible();
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-list.png`);

  await openCreate(page, createLink, `${options.path}/create`);
  await waitForPageReady(page);
  await expect(page.getByRole('heading', { name: options.createHeading })).toBeVisible({
    timeout: 60_000
  });
  await discardResumeBanner(page);
  await expectStep(page, 'Details');
  await fillDetails(page, options);
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-create.png`);

  if ((await field(page, 'details.name').inputValue()) !== options.name) {
    await fillDetails(page, options);
  }
  try {
    await clickNext(page);
  } catch (error) {
    if ((await field(page, 'details.name').inputValue()) === options.name) {
      throw error;
    }
    await fillDetails(page, options);
    await clickNext(page);
  }
  await expectStep(page, 'Currency');
  await chooseFirstIfEmpty(page, 'currency.currencyCode');
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-currency.png`);

  await clickNext(page);
  await expectStep(page, 'Terms');
  await fillIfBlankOrZero(page, 'terms.depositAmount', '1000');
  for (const fieldId of [
    'terms.interestCompoundingPeriodType',
    'terms.interestPostingPeriodType',
    'terms.interestCalculationType',
    'terms.interestCalculationDaysInYearType'
  ]) {
    await chooseFirstIfEmpty(page, fieldId);
  }
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-terms.png`, 1100);

  await clickNext(page);
  await expectStep(page, 'Settings');
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-settings.png`, 1400);

  if (options.captureSharedBranches) {
    await captureSwitchSection(page, {
      switchName: /Enable lock-in period/,
      card: 'Lock-in period',
      file: `${IMG}/deposit-products-settings-lock-in.png`,
      fill: async () => {
        await fillById(page, 'settings.lockinPeriodFrequency', '3');
        await chooseFirstIfEmpty(page, 'settings.lockinPeriodFrequencyType');
      }
    });
    await captureSwitchSection(page, {
      switchName: /Pre-closure penalty applicable/,
      card: 'Pre-closure penalty',
      file: `${IMG}/deposit-products-settings-pre-closure.png`,
      fill: async () => {
        await fillById(page, 'settings.preClosurePenalInterest', '2');
        await chooseFirstIfEmpty(page, 'settings.preClosurePenalInterestOnTypeId');
      }
    });
    await captureSwitchSection(page, {
      switchName: /Withhold tax/,
      card: 'Tax',
      file: `${IMG}/deposit-products-settings-tax.png`
    });
  }

  await fillIfBlankOrZero(page, 'settings.minDepositTerm', '12');
  await chooseFirstIfEmpty(page, 'settings.minDepositTermTypeId');

  await clickNext(page);
  await expectStep(page, 'Interest rate chart');
  await expect(page.getByRole('button', { name: 'Edit slab' })).toBeVisible();
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-interest-chart.png`);
  await completeStarterChart(page);
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-interest-chart-slab.png`, 1100);

  await clickNext(page);
  await expectStep(page, 'Charges');
  await expect(page.getByText(/Fees|charges/i).first()).toBeVisible();
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-charges.png`);

  await clickNext(page);
  await expectStep(page, 'Accounting');
  const cash = page.getByRole('radio', { name: /CASH BASED/i });
  await expect(cash).toBeChecked();
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-accounting.png`, 1600);

  if (options.captureSharedBranches) {
    await page.getByRole('radio', { name: /ACCRUAL PERIODIC/i }).check();
    await expect(page.getByRole('button', { name: /Interest payable/ })).toBeVisible();
    await scrollWizardToTop(page);
    const step = page.locator('div.space-y-6').filter({ has: cash });
    await step.evaluate((element) => {
      element.style.paddingBottom = '96px';
    });
    await captureDocsElement(page, step, `${IMG}/deposit-products-accounting-accrual.png`);
    await cash.check();
    await expect(page.getByRole('button', { name: /Interest payable/ })).toHaveCount(0);

    await setSwitch(page, /Configure payment channel and charge mappings/, true);
    await expect(page.getByText('Payment channels', { exact: true })).toBeVisible();
    await captureDocsElement(
      page,
      sectionCard(page, 'Advanced mappings'),
      `${IMG}/deposit-products-accounting-mappings.png`
    );
    await setSwitch(page, /Configure payment channel and charge mappings/, false);
  }

  for (const fieldId of CASH_GL_FIELDS) {
    await chooseFirstIfEmpty(page, fieldId);
  }

  await clickNext(page);
  await expectStep(page, 'Preview');
  await scrollWizardToTop(page);
  await captureDocsScreenshot(page, `${IMG}/${options.filePrefix}-preview.png`, 1800);
}

async function completeStarterChart(page: Page) {
  await page.getByRole('button', { name: 'Edit chart' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'Edit interest rate chart' })).toBeVisible();
  await sheet.getByRole('textbox', { name: /^Name/ }).fill('Standard rates');
  await sheet.getByRole('button', { name: /Valid from/ }).click();
  await page.evaluate(() => {
    const today = new Date().toLocaleDateString();
    const button = document.querySelector(`button[data-day="${today}"]`);
    if (!(button instanceof HTMLElement)) {
      throw new Error(`No calendar day for ${today}`);
    }
    button.click();
  });
  await sheet.getByRole('button', { name: 'Save chart' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Standard rates')).toBeVisible();

  await page.getByRole('button', { name: 'Edit slab' }).click();
  const slab = page.getByRole('dialog');
  await expect(slab.getByRole('heading', { name: 'Edit rate slab' })).toBeVisible();
  const periodType = slab.locator('[id$="-periodType"]');
  if ((await periodType.innerText()).includes('Select')) {
    await periodType.click();
    await page.locator('[cmdk-item]').first().click();
  }
  await slab.locator('[id$="-fromPeriod"]').fill('0');
  await slab.locator('[id$="-rate"]').fill('8');
  await slab.getByRole('button', { name: 'Save slab' }).click();
  await expect(slab).toBeHidden();
  await expect(page.getByRole('cell', { name: '8' })).toBeVisible();
}

async function captureSwitchSection(
  page: Page,
  options: {
    switchName: RegExp;
    card: string;
    file: string;
    fill?: () => Promise<void>;
  }
) {
  await setSwitch(page, options.switchName, true);
  if (options.fill) {
    await options.fill();
  }
  await captureDocsElement(page, sectionCard(page, options.card), options.file);
  await setSwitch(page, options.switchName, false);
}

function sectionCard(page: Page, title: string) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) });
}

function field(page: Page, fieldId: string) {
  return page.locator(`[id="${fieldId}"]`);
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

async function fillDetails(
  page: Page,
  options: { name: string; shortName: string; description: string }
) {
  await fillById(page, 'details.name', options.name);
  await fillById(page, 'details.shortName', options.shortName);
  await fillById(page, 'details.description', options.description);
  await expect(field(page, 'details.name')).toHaveValue(options.name);
}

async function openCreate(page: Page, createLink: ReturnType<Page['getByRole']>, url: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await Promise.all([
        page.waitForURL(/\/create(?:\?|$)/, { timeout: 120_000 }),
        createLink.click()
      ]);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('ERR_INSUFFICIENT_RESOURCES') ||
        message.includes('ERR_ABORTED') ||
        message.includes('Timeout');
      if (attempt === 2 || !retryable) {
        throw error;
      }
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 }).catch(() => undefined);
    }
  }
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

async function fillById(page: Page, fieldId: string, value: string) {
  await field(page, fieldId).fill(value);
}

async function fillIfBlankOrZero(page: Page, fieldId: string, value: string) {
  const raw = (await field(page, fieldId).inputValue()).replace(/,/g, '').trim();
  if (!raw || Number(raw) <= 0) {
    await fillById(page, fieldId, value);
  }
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

async function setSwitch(page: Page, name: RegExp, on: boolean) {
  const toggle = page.getByRole('switch', { name });
  await toggle.scrollIntoViewIfNeeded();
  const isOn = (await toggle.getAttribute('data-checked')) != null;
  if (isOn !== on) {
    await toggle.click();
  }
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

async function createGl(
  name: string,
  glCode: string,
  type: number,
  usage: number,
  parentId?: number
): Promise<number> {
  const created = (await fineract('/glaccounts', {
    method: 'POST',
    body: JSON.stringify({
      name,
      glCode,
      type,
      usage,
      manualEntriesAllowed: usage === 1,
      parentId,
      locale: 'en'
    })
  })) as { resourceId?: number };
  const id = Number(created.resourceId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`GL account ${glCode} was not created`);
  }
  return id;
}
