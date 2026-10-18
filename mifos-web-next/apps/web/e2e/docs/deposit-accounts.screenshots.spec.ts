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

const IMG = 'end-users/clients';
const FIXED_PRODUCT = 'Term deposit';
const RECURRING_PRODUCT = 'Monthly saver';

test.describe('Docs screenshots — open deposit accounts', () => {
  test('captures fixed and recurring deposit applications', async ({ page }) => {
    test.setTimeout(240_000);

    const clientId = String(await seedDepositAccountHandbook());

    await captureApplication(page, {
      clientId,
      path: 'fixed-deposits',
      listTitle: 'Fixed deposit accounts',
      createLinkName: 'New fixed deposit account',
      sheetTitle: 'New fixed deposit account',
      productName: FIXED_PRODUCT,
      listFile: `${IMG}/open-fixed-deposit-list.png`,
      beforeFile: `${IMG}/open-fixed-deposit-product.png`,
      afterFile: `${IMG}/open-fixed-deposit-terms.png`,
      recurring: false
    });

    await captureApplication(page, {
      clientId,
      path: 'recurring-deposits',
      listTitle: 'Recurring deposit accounts',
      createLinkName: 'New recurring deposit account',
      sheetTitle: 'New recurring deposit account',
      productName: RECURRING_PRODUCT,
      listFile: `${IMG}/open-recurring-deposit-list.png`,
      beforeFile: `${IMG}/open-recurring-deposit-product.png`,
      afterFile: `${IMG}/open-recurring-deposit-terms.png`,
      recurring: true
    });
  });
});

async function captureApplication(
  page: Page,
  options: {
    clientId: string;
    path: string;
    listTitle: string;
    createLinkName: string;
    sheetTitle: string;
    productName: string;
    listFile: string;
    beforeFile: string;
    afterFile: string;
    recurring: boolean;
  }
) {
  await page.goto(`/clients/${options.clientId}/${options.path}`);
  await expect(page.getByText(options.listTitle, { exact: true })).toBeVisible();
  const createLink = page.getByRole('link', { name: options.createLinkName }).first();
  await expect(createLink, 'The customer must be active so a new account can be opened').toBeVisible();
  await captureDocsScreenshot(page, options.listFile);

  await Promise.all([
    page.waitForURL(new RegExp(`[?&]create=1`), { timeout: 60_000 }),
    createLink.click()
  ]);
  const sheet = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: options.sheetTitle })
  });
  await expect(sheet.getByRole('heading', { name: options.sheetTitle })).toBeVisible({
    timeout: 30_000
  });
  await expect(sheet.getByText('Select a product first')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Submit', exact: true })).toBeEnabled({
    timeout: 30_000
  });
  await expandSheet(sheet);
  await captureDocsElement(page, sheet, options.beforeFile);

  await sheet.getByRole('button', { name: 'Select product' }).click();
  const product = page.locator('[cmdk-item]').filter({ hasText: options.productName });
  await expect(product).toBeVisible({ timeout: 15_000 });
  await product.click();
  const amount = sheet.locator('#deposit-amount');
  await expect(amount).toBeVisible({ timeout: 30_000 });
  await fillIfBlankOrZero(amount, '1000');
  await fillIfBlankOrZero(sheet.locator('#deposit-period'), '12');
  await chooseIfPlaceholder(sheet, /Select frequency/);

  if (options.recurring) {
    await fillIfBlankOrZero(sheet.locator('#recurring-frequency'), '1');
    await chooseIfPlaceholder(sheet, /Select type/);
    await fillIfBlankOrZero(sheet.locator('#mandatory-recommended-deposit'), '1000');
  }

  await sheet.locator('#deposit-external-id').fill(options.recurring ? 'RD-1001' : 'FD-1001');
  await expandSheet(sheet);
  await captureDocsElement(page, sheet, options.afterFile);

  await sheet.getByRole('button', { name: 'Cancel' }).click();
  await expect(sheet).toBeHidden();
}

async function expandSheet(sheet: ReturnType<Page['getByRole']>) {
  await sheet.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    element.style.position = 'absolute';
    element.style.inset = 'auto';
    element.style.top = '0px';
    element.style.right = '0px';
    element.style.bottom = 'auto';
    element.style.height = 'auto';
    element.style.maxHeight = 'none';
    for (const node of element.querySelectorAll('.overflow-y-auto')) {
      if (node instanceof HTMLElement) {
        node.style.overflow = 'visible';
        node.style.flex = 'none';
        node.style.height = 'auto';
        node.style.maxHeight = 'none';
      }
    }
  });
}

async function fillIfBlankOrZero(input: ReturnType<Page['locator']>, value: string) {
  const raw = (await input.inputValue()).replace(/,/g, '').trim();
  if (!raw || Number(raw) <= 0) {
    await input.fill(value);
  }
}

async function chooseIfPlaceholder(sheet: ReturnType<Page['getByRole']>, name: RegExp) {
  const button = sheet.getByRole('button', { name });
  if (!(await button.isVisible().catch(() => false))) {
    return;
  }
  if (!(await button.innerText()).includes('Select')) {
    return;
  }
  await button.click();
  const item = sheet.page().locator('[cmdk-item]').first();
  await expect(item).toBeVisible({ timeout: 15_000 });
  await item.click();
  await expect(sheet.page().locator('[cmdk-item]')).toHaveCount(0);
}

type EnumOption = { id?: number; value?: string; code?: string };

async function seedDepositAccountHandbook(): Promise<number> {
  const offices = (await fineract('/offices')) as Array<{ id?: number }>;
  const officeId = offices.find((office) => office.id != null)?.id;
  if (officeId == null) {
    throw new Error('No office is available to attach the handbook customer');
  }

  const template = (await fineract('/fixeddepositproducts/template')) as {
    currencyOptions?: Array<{ code?: string }>;
    interestCompoundingPeriodTypeOptions?: EnumOption[];
    interestPostingPeriodTypeOptions?: EnumOption[];
    interestCalculationTypeOptions?: EnumOption[];
    interestCalculationDaysInYearTypeOptions?: EnumOption[];
    periodFrequencyTypeOptions?: EnumOption[];
    chartTemplate?: { periodTypes?: EnumOption[] };
  };

  const currencyCode = template.currencyOptions?.find((option) => option.code === 'USD')?.code
    ?? template.currencyOptions?.find((option) => option.code)?.code;
  if (!currencyCode) {
    throw new Error('Deposit product template has no currency');
  }

  const monthType = optionId(template.periodFrequencyTypeOptions, /month/i);
  const chartPeriodType = optionId(template.chartTemplate?.periodTypes);
  const today = fineractToday();

  await ensureDepositProduct('/fixeddepositproducts', {
    name: FIXED_PRODUCT,
    shortName: 'TERM',
    description: 'Lump-sum deposit held for a fixed term.',
    currencyCode,
    digitsAfterDecimal: '2',
    depositAmount: '1000',
    interestCompoundingPeriodType: optionId(template.interestCompoundingPeriodTypeOptions, /daily/i),
    interestPostingPeriodType: optionId(template.interestPostingPeriodTypeOptions, /month/i),
    interestCalculationType: optionId(template.interestCalculationTypeOptions),
    interestCalculationDaysInYearType: optionId(template.interestCalculationDaysInYearTypeOptions),
    accountingRule: '1',
    minDepositTerm: '12',
    minDepositTermTypeId: monthType,
    preClosurePenalApplicable: false,
    withHoldTax: false,
    charts: [
      {
        fromDate: today,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en',
        isPrimaryGroupingByAmount: false,
        chartSlabs: [
          {
            description: 'Default',
            periodType: chartPeriodType,
            fromPeriod: '0',
            annualInterestRate: '8',
            locale: 'en'
          }
        ]
      }
    ],
    locale: 'en'
  });

  await ensureDepositProduct('/recurringdepositproducts', {
    name: RECURRING_PRODUCT,
    shortName: 'SAVE',
    description: 'Regular installments held for a fixed term.',
    currencyCode,
    digitsAfterDecimal: '2',
    depositAmount: '1000',
    interestCompoundingPeriodType: optionId(template.interestCompoundingPeriodTypeOptions, /daily/i),
    interestPostingPeriodType: optionId(template.interestPostingPeriodTypeOptions, /month/i),
    interestCalculationType: optionId(template.interestCalculationTypeOptions),
    interestCalculationDaysInYearType: optionId(template.interestCalculationDaysInYearTypeOptions),
    accountingRule: '1',
    minDepositTerm: '12',
    minDepositTermTypeId: monthType,
    isMandatoryDeposit: false,
    adjustAdvanceTowardsFuturePayments: false,
    allowWithdrawal: false,
    preClosurePenalApplicable: false,
    withHoldTax: false,
    charts: [
      {
        fromDate: today,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en',
        isPrimaryGroupingByAmount: false,
        chartSlabs: [
          {
            description: 'Default',
            periodType: chartPeriodType,
            fromPeriod: '0',
            annualInterestRate: '8',
            locale: 'en'
          }
        ]
      }
    ],
    locale: 'en'
  });

  const clients = (await fineract('/clients?limit=50')) as {
    pageItems?: Array<{ id?: number; active?: boolean }>;
  };
  const existing = clients.pageItems?.find((client) => client.active === true && client.id != null);
  if (existing?.id != null) {
    return existing.id;
  }

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

async function ensureDepositProduct(path: string, body: Record<string, unknown>) {
  const products = (await fineract(path)) as Array<{ id?: number; name?: string }>;
  if (products.some((product) => product.name === body.name)) {
    return;
  }
  await fineract(path, { method: 'POST', body: JSON.stringify(body) });
}

function optionId(options: EnumOption[] | undefined, match?: RegExp): number {
  const found = match ? options?.find((option) => match.test(`${option.value ?? ''} ${option.code ?? ''}`)) : undefined;
  const id = found?.id ?? options?.[0]?.id;
  if (id == null) {
    throw new Error('Deposit product template is missing an option');
  }
  return id;
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
