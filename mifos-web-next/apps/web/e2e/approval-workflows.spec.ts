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
  let runSuffix: string;

  test.beforeAll(async () => {
    fineract = await createFineractE2eClient();
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

  test('activates one loan workflow and blocks a second until the first is deactivated', async ({
    page
  }) => {
    const firstPayload = fineract.buildDefaultLoanWorkflow(runSuffix);
    const secondPayload = fineract.buildLargeLoanWorkflow(runSuffix);

    const firstResult = await fineract.createWorkflowDefinition(firstPayload);
    const secondResult = await fineract.createWorkflowDefinition(secondPayload);
    expect(firstResult.resourceId).toBeTruthy();
    expect(secondResult.resourceId).toBeTruthy();

    await page.goto(APPROVAL_WORKFLOWS_PATH);
    await expect(page.getByRole('link', { name: firstPayload.name })).toBeVisible();
    await expect(page.getByRole('link', { name: secondPayload.name })).toBeVisible();
    await expect(page.getByText('CREATE_LOAN').first()).toBeVisible();

    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/${firstResult.resourceId}`);
    await expect(page.getByRole('heading', { name: firstPayload.name })).toBeVisible();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
    await expect(page.getByText('CREATE_LOAN_CHECKER').first()).toBeVisible();

    await fineract.activateWorkflowDefinition(firstResult.resourceId as number);
    await page.reload();
    await expect(page.getByText('Active', { exact: true })).toBeVisible();

    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/${secondResult.resourceId}`);
    await expect(page.getByRole('heading', { name: secondPayload.name })).toBeVisible();
    await expect(fineract.activateWorkflowDefinition(secondResult.resourceId as number)).rejects.toThrow(
      /active\.definition\.already\.exists\.for\.task|already exists.*task/i
    );

    await fineract.deactivateWorkflowDefinition(firstResult.resourceId as number);
    await fineract.activateWorkflowDefinition(secondResult.resourceId as number);
    await page.reload();
    await expect(page.getByText('Active', { exact: true })).toBeVisible();
    await expect(page.getByText('BRANCH_MANAGER', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('REGIONAL_MANAGER', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('CREDIT_COMMITTEE', { exact: true }).first()).toBeVisible();
  });

  test('rejects activating a second active workflow for the same task', async () => {
    const first = fineract.buildDefaultLoanWorkflow(`${runSuffix}-peer-a`);
    first.name = e2eWorkflowName('Peer A', runSuffix);
    const second = fineract.buildDefaultLoanWorkflow(`${runSuffix}-peer-b`);
    second.name = e2eWorkflowName('Peer B', runSuffix);

    const firstResult = await fineract.createWorkflowDefinition(first);
    const secondResult = await fineract.createWorkflowDefinition(second);
    expect(firstResult.resourceId).toBeTruthy();
    expect(secondResult.resourceId).toBeTruthy();

    await fineract.activateWorkflowDefinition(firstResult.resourceId as number);
    await expect(fineract.activateWorkflowDefinition(secondResult.resourceId as number)).rejects.toThrow(
      /active\.definition\.already\.exists\.for\.task|already exists.*task/i
    );
  });

  test('rejects activating a cyclic draft via Fineract', async () => {
    const cyclicPayload = fineract.buildCyclicDraftWorkflow(runSuffix);
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
    const payload = fineract.buildDefaultLoanWorkflow(`${runSuffix}-draft`);
    payload.name = e2eWorkflowName('UI Draft', runSuffix);
    const created = await fineract.createWorkflowDefinition(payload);
    expect(created.resourceId).toBeTruthy();

    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/create`);
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create approval workflow' })).toBeVisible();
    await expect(page.getByText('CREATE_LOAN').first()).toBeVisible();
    await expect(page.getByText('Stages', { exact: true }).first()).toBeVisible();

    await page.goto(APPROVAL_WORKFLOWS_PATH);
    await expect(page.getByRole('link', { name: payload.name })).toBeVisible();
    await page.goto(`${APPROVAL_WORKFLOWS_PATH}/${created.resourceId}`);
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  });
});
