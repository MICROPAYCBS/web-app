/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, test } from '@playwright/test';
import { APPROVAL_WORKFLOWS_PATH, e2eWorkflowName } from './helpers/env';
import { waitForPageReady } from './helpers/interactions';
import { createFineractE2eClient, type FineractE2eClient } from './helpers/fineract-api';

test.describe.configure({ mode: 'serial' });

test.describe('Approval workflows', () => {
  let fineract: FineractE2eClient;
  let roleId: number;
  let runSuffix: string;

  test.beforeAll(async () => {
    fineract = await createFineractE2eClient();
    roleId = await fineract.firstActiveRoleId();
    runSuffix = Date.now().toString(36);
    await fineract.setApprovalWorkflowsEnabled(true);
    await fineract.cleanupE2eWorkflows();
  });

  test.afterAll(async () => {
    await fineract.cleanupE2eWorkflows();
    await fineract.setApprovalWorkflowsEnabled(true);
  });

  test('lists approval workflows for signed-in admin', async ({ page }) => {
    await page.goto(APPROVAL_WORKFLOWS_PATH);
    await expect(page.getByRole('heading', { name: 'Approval workflows' })).toBeVisible();
    await expect(page.getByRole('link', { name: /create workflow/i })).toBeVisible();
  });

  test('creates and activates default and large loan workflows', async ({ page }) => {
    const defaultPayload = fineract.buildDefaultLoanWorkflow(roleId, runSuffix);
    const largePayload = fineract.buildLargeLoanWorkflow(roleId, runSuffix);

    const defaultResult = await fineract.createWorkflowDefinition(defaultPayload);
    const largeResult = await fineract.createWorkflowDefinition(largePayload);
    expect(defaultResult.resourceId).toBeTruthy();
    expect(largeResult.resourceId).toBeTruthy();

    await page.goto(APPROVAL_WORKFLOWS_PATH);
    await expect(page.getByRole('link', { name: defaultPayload.name })).toBeVisible();
    await expect(page.getByRole('link', { name: largePayload.name })).toBeVisible();
    await expect(page.getByText('Default').first()).toBeVisible();
    await expect(page.getByText(/5[,.]?000[,.]?000/).first()).toBeVisible();

    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/${defaultResult.resourceId}`);
    await expect(page.getByRole('heading', { name: defaultPayload.name })).toBeVisible();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();

    await fineract.activateWorkflowDefinition(defaultResult.resourceId as number);
    await page.reload();
    await expect(page.getByText('Active', { exact: true })).toBeVisible();

    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/${largeResult.resourceId}`);
    await expect(page.getByRole('heading', { name: largePayload.name })).toBeVisible();
    await fineract.activateWorkflowDefinition(largeResult.resourceId as number);
    await page.reload();
    await expect(page.getByText('Active', { exact: true })).toBeVisible();
    await expect(page.getByText('BRANCH_MANAGER', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('REGIONAL_MANAGER', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('CREDIT_COMMITTEE', { exact: true }).first()).toBeVisible();
  });

  test('rejects activating a cyclic draft via Fineract', async () => {
    const cyclicPayload = fineract.buildCyclicDraftWorkflow(roleId, runSuffix);
    const created = await fineract.createWorkflowDefinition(cyclicPayload);
    expect(created.resourceId).toBeTruthy();

    await expect(fineract.activateWorkflowDefinition(created.resourceId as number)).rejects.toThrow();
  });

  test('shows disabled-engine banner when workflows are turned off', async ({ page }) => {
    await fineract.setApprovalWorkflowsEnabled(false);

    await page.goto(APPROVAL_WORKFLOWS_PATH);
    await waitForPageReady(page);
    await expect(
      page.getByText('Approval workflows are disabled for this institution')
    ).toBeVisible();
    await expect(page.locator('#enable-approval-workflows')).toBeVisible();

    await fineract.setApprovalWorkflowsEnabled(true);
    const config = await fineract.getApprovalWorkflowsConfig();
    expect(config.enabled).toBe(true);
  });

  test('shows create form and lists an API-created draft', async ({ page }) => {
    const payload = fineract.buildDefaultLoanWorkflow(roleId, `${runSuffix}-draft`);
    payload.name = e2eWorkflowName('UI Draft', runSuffix);
    const created = await fineract.createWorkflowDefinition(payload);
    expect(created.resourceId).toBeTruthy();

    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/create`);
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create approval workflow' })).toBeVisible();
    await expect(page.getByText('CREATE_LOAN').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Stages' })).toBeVisible();

    await page.goto(APPROVAL_WORKFLOWS_PATH);
    await expect(page.getByRole('link', { name: payload.name })).toBeVisible();
    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/${created.resourceId}`);
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  });
});
