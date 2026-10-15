/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, test, type Locator, type Page } from '@playwright/test';
import { captureDocsScreenshot } from '../helpers/docs-screenshots';
import { waitForPageReady } from '../helpers/interactions';

const CLIENTS_PATH = '/clients';

/** 1×1 PNG so handbook captures can attach a photo without a camera. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test.describe('Docs screenshots — clients (customers)', () => {
  test('captures the customer onboarding journey', async ({ page }) => {
    test.setTimeout(240_000);

    await page.goto(CLIENTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'New customer' });
    await expect(createLink).toBeVisible();
    await captureDocsScreenshot(page, 'end-users/clients/clients-list.png');

    await Promise.all([
      page.waitForURL(/\/clients\/create(?:\?|$)/, { timeout: 60_000 }),
      createLink.click()
    ]);
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create customer' })).toBeVisible({
      timeout: 60_000
    });
    await discardResumeBanner(page);
    await expectStep(page, 'Biodata');

    await captureDocsScreenshot(page, 'end-users/clients/create-client-wizard.png');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-biodata.png');

    await chooseMatching(page, 'legalFormId', /entity/i);
    await expect(page.getByLabel('Entity name')).toBeVisible();
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, 'end-users/clients/create-client-biodata-entity.png', 1100);
    await chooseMatching(page, 'legalFormId', /person/i);

    await page.getByLabel('First name').fill('Amina');
    await page.getByLabel('Last name').fill('Nakato');
    await chooseFirst(page, 'genderId');
    await chooseFirst(page, 'maritalStatusId');
    await chooseFirst(page, 'nationalityCountryId');
    await pickDateOfBirth(page);
    await captureClassThatShowsKyc(page);

    await expectStep(page, 'Contact');
    await page.locator('#mobileNo').fill('+256712345678');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-contact.png');

    await page.getByRole('tab', { name: /Additional contacts/ }).click();
    await captureDocsScreenshot(page, 'end-users/clients/create-client-contact-additional.png');
    const addContact = page.getByRole('button', { name: 'Add contact' }).first();
    if (await addContact.isEnabled()) {
      await addContact.click();
      await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Add customer contact');
      await captureDocsScreenshot(page, 'end-users/clients/create-client-add-contact.png');
      await page
        .locator('[data-slot="sheet-content"]')
        .getByRole('button', { name: 'Cancel' })
        .click();
      await expect(page.locator('[data-slot="sheet-title"]')).toHaveCount(0);
    }

    await clickNext(page);
    await expectStep(page, 'Identification');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-identification.png');
    await page.getByRole('button', { name: 'Add identifier' }).first().click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Add identifier');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-add-identifier.png');
    await fillIdentifier(page);
    await saveSheet(page, 'Add identifier');

    await clickNext(page);
    await expectStep(page, 'Address');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-address.png');
    await page.getByRole('button', { name: 'Add address' }).first().click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Add address');
    await expect(page.getByRole('button', { name: 'Select region', exact: true })).toBeVisible({
      timeout: 20_000
    });
    await captureDocsScreenshot(page, 'end-users/clients/create-client-add-address.png', 1100);
    await fillAddress(page);
    await saveSheet(page, 'Save');

    await clickNext(page);
    await expectStep(page, 'Customer profiling');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-profiling.png');

    await clickNext(page);
    await expectStep(page, 'Next of kin');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-next-of-kin.png');
    await page.getByRole('button', { name: 'Add next of kin' }).first().click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Add next of kin');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-add-next-of-kin.png');
    const kinSheet = page.locator('[data-slot="sheet-content"]');
    await kinSheet.getByLabel('First name').fill('Amina');
    await kinSheet.getByLabel('Last name').fill('Okello');
    await chooseFirst(page, 'familyRelationshipId');
    await chooseFirst(page, 'familyGenderId');
    await saveSheet(page, 'Save');

    await clickNext(page);
    await expectStep(page, 'Income sources');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-income.png');
    await page.getByRole('button', { name: 'Add income source' }).first().click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Add income source');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-add-income.png');
    await chooseFirst(page, 'incomeSourceTypeId');
    await saveSheet(page, 'Save');

    await clickNext(page);
    await expectStep(page, 'Compliance');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-compliance.png');
    await page.getByRole('switch', { name: /Has other bank accounts/ }).click();
    await page.getByRole('switch', { name: /Is PEP/ }).click();
    await page.getByRole('switch', { name: /FATCA registered/ }).click();
    await page.locator('#otherBankName0').fill('Demo Bank');
    await page.locator('#otherBankAccount0').fill('000123456789');
    await page.locator('#pepPosition').fill('Public office');
    await page.locator('#fatcaRegistrationNo').fill('FATCA-0001');
    await scrollWizardToTop(page);
    await captureDocsScreenshot(page, 'end-users/clients/create-client-compliance-details.png', 1200);
    await page.getByRole('switch', { name: /Has other bank accounts/ }).click();
    await page.getByRole('switch', { name: /Is PEP/ }).click();
    await page.getByRole('switch', { name: /FATCA registered/ }).click();

    await clickNext(page);
    for (let extra = 0; extra < 6; extra += 1) {
      const label = await stepLabel(page);
      if (/account opening/i.test(label) || /preview/i.test(label)) {
        break;
      }
      await captureDocsScreenshot(page, `end-users/clients/create-client-extra-${extra}.png`);
      await clickNext(page);
    }

    await expectStep(page, 'Account opening');
    await chooseFirst(page, 'staffId');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-account-opening.png');

    await clickNext(page);
    await expectStep(page, 'Preview');
    await captureDocsScreenshot(page, 'end-users/clients/create-client-preview.png');
  });
});

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
    .filter(Boolean);
  return lines[lines.length - 1] ?? text.trim();
}

async function expectStep(page: Page, label: string) {
  await expect.poll(async () => stepLabel(page), { timeout: 20_000 }).toBe(label);
}

async function clickNext(page: Page) {
  const before = await stepLabel(page);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  try {
    await expect.poll(async () => stepLabel(page), { timeout: 12_000 }).not.toBe(before);
  } catch {
    const errors = await page.locator('.text-destructive, [role="alert"]').allInnerTexts();
    throw new Error(`Stuck on ${before}: ${errors.join(' | ') || 'no field error'}`);
  }
}

async function chooseFirst(page: Page, fieldId: string) {
  await page.locator(`#${fieldId}`).click();
  const item = page.locator('[cmdk-item]').first();
  await expect(item).toBeVisible({ timeout: 15_000 });
  await item.click();
  await expect(page.locator('[cmdk-item]')).toHaveCount(0);
}

async function chooseMatching(page: Page, fieldId: string, pattern: RegExp) {
  await page.locator(`#${fieldId}`).click();
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
  throw new Error(`No option matched ${pattern}`);
}

async function chooseFirstFrom(page: Page, trigger: Locator) {
  await trigger.click({ timeout: 10_000 });
  const item = page.locator('[cmdk-item]').first();
  await expect(item).toBeVisible({ timeout: 15_000 });
  await item.click();
  await expect(page.locator('[cmdk-item]')).toHaveCount(0);
}

async function chooseCalendarOption(page: Page, label: string, optionText: string) {
  await page.getByLabel(label).evaluate((select, text) => {
    const element = select as HTMLSelectElement;
    const option = Array.from(element.options).find((item) => item.text === text);
    if (!option) {
      throw new Error(`Missing ${text} in ${element.getAttribute('aria-label')}`);
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    setter?.call(element, option.value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, optionText);
}

async function pickDateOfBirth(page: Page) {
  await page.locator('#dateOfBirth').click();
  await expect(page.getByLabel('Choose the Year')).toBeAttached();
  await chooseCalendarOption(page, 'Choose the Year', '1990');
  await chooseCalendarOption(page, 'Choose the Month', 'Jan');
  await page.getByRole('button', { name: /January 15(th)?, 1990/ }).click();
  await expect(page.locator('#dateOfBirth')).toContainText('1990');
}

async function captureClassThatShowsKyc(page: Page) {
  await page.locator('#customerClassId').click();
  const items = page.locator('[cmdk-item]');
  await expect(items.first()).toBeVisible({ timeout: 15_000 });
  const labels = (await items.allInnerTexts()).map((text) => text.trim()).filter(Boolean).slice(0, 6);
  await page.keyboard.press('Escape');

  for (const label of labels) {
    if ((await stepLabel(page)) !== 'Biodata') {
      await page.getByRole('button', { name: 'Biodata' }).first().click();
      await expectStep(page, 'Biodata');
    }
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await chooseMatching(page, 'customerClassId', new RegExp(`^${escaped}$`));
    await clickNext(page);
    if ((await stepLabel(page)) === 'Photo and signature') {
      await scrollWizardToTop(page);
      await captureDocsScreenshot(page, 'end-users/clients/create-client-kyc.png', 1100);
      await uploadKycIfPresent(page);
      await clickNext(page);
      return;
    }
  }
}

async function uploadKycIfPresent(page: Page) {
  if (await page.getByRole('heading', { name: 'Customer photo' }).isVisible()) {
    await page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Customer photo' }) })
      .getByRole('button', { name: 'Upload' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Upload customer photo' });
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'customer-photo.png',
      mimeType: 'image/png',
      buffer: PNG
    });
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).toBeHidden();
  }

  if (await page.getByRole('heading', { name: 'Signature' }).isVisible()) {
    await page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Signature' }) })
      .getByRole('button', { name: 'Upload' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Upload signature' });
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'signature.png',
      mimeType: 'image/png',
      buffer: PNG
    });
    await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}

async function fillIdentifier(page: Page) {
  const sheet = page.locator('[data-slot="sheet-content"]');
  await chooseFirstFrom(page, sheet.getByRole('button', { name: 'Type', exact: true }));
  const number = sheet.getByLabel('Document number');
  const placeholder = (await number.getAttribute('placeholder'))?.trim();
  await number.fill(placeholder && !/^select/i.test(placeholder) ? placeholder : 'CM12345678901234');
}

async function fillAddress(page: Page) {
  const sheet = page.locator('[data-slot="sheet-content"]');
  await chooseFirstFrom(page, sheet.getByRole('button', { name: 'Select…', exact: true }).first());
  for (const name of [
    'Select region',
    'Select district',
    'Select county',
    'Select sub-county',
    'Select parish',
    'Select village'
  ]) {
    const trigger = sheet.getByRole('button', { name, exact: true });
    await expect(trigger).toBeEnabled({ timeout: 20_000 });
    await chooseFirstFrom(page, trigger);
  }
}

async function saveSheet(page: Page, submitLabel: string) {
  await page
    .locator('[data-slot="sheet-footer"]')
    .getByRole('button', { name: submitLabel, exact: true })
    .click();
  try {
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveCount(0, { timeout: 10_000 });
  } catch {
    const errors = await page.locator('[data-slot="sheet-content"] .text-destructive').allInnerTexts();
    throw new Error(`Sheet did not close: ${errors.join(' | ') || 'unknown validation error'}`);
  }
}
