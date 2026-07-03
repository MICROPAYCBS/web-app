/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  E2E_FINERACT_API_URL,
  E2E_FINERACT_TENANT_ID,
  E2E_PASSWORD,
  E2E_USERNAME,
  E2E_WORKFLOW_NAME_PREFIX,
  e2eWorkflowName
} from './env';

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

interface FineractAuthResponse {
  base64EncodedAuthenticationKey?: string;
}

interface FineractRole {
  id: number;
  name: string;
  disabled?: boolean;
}

interface WorkflowDefinitionSummary {
  id: number;
  name: string;
  status?: string;
}

interface GlobalConfiguration {
  id: number;
  name: string;
  enabled: boolean;
}

export class FineractE2eClient {
  private authHeader: string | null = null;

  constructor(
    private readonly baseUrl = E2E_FINERACT_API_URL.replace(/\/$/, ''),
    private readonly tenantId = E2E_FINERACT_TENANT_ID
  ) {}

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/authentication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Fineract-Platform-TenantId': this.tenantId
      },
      body: JSON.stringify({
        username: E2E_USERNAME,
        password: E2E_PASSWORD
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Fineract authentication failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as FineractAuthResponse;
    if (!data.base64EncodedAuthenticationKey) {
      throw new Error('Fineract authentication response missing credentials.');
    }

    this.authHeader = `Basic ${data.base64EncodedAuthenticationKey}`;
    return data;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.authHeader) {
      await this.authenticate();
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Fineract-Platform-TenantId': this.tenantId,
        Authorization: this.authHeader ?? ''
      },
      body: body == null ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`Fineract ${method} ${path} failed (${response.status}): ${text}`);
      (error as Error & { status: number; body: string }).status = response.status;
      (error as Error & { status: number; body: string }).body = text;
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async probeHealth(): Promise<void> {
    const providerBase = this.baseUrl.replace(/\/api\/v1$/, '');
    const response = await fetch(`${providerBase}/actuator/health`, {
      headers: { 'Fineract-Platform-TenantId': this.tenantId }
    });
    if (!response.ok) {
      throw new Error(`Fineract health check failed (${response.status}). Is it running on port 8443?`);
    }
  }

  async listRoles(): Promise<FineractRole[]> {
    return this.request<FineractRole[]>('GET', '/roles');
  }

  async firstActiveRoleId(): Promise<number> {
    const roles = await this.listRoles();
    const role = roles.find((item) => !item.disabled);
    if (!role) {
      throw new Error('No active Fineract role found for workflow participant tests.');
    }
    return role.id;
  }

  async listWorkflowDefinitions(): Promise<WorkflowDefinitionSummary[]> {
    return this.request<WorkflowDefinitionSummary[]>('GET', '/workflow-definitions');
  }

  async deleteWorkflowDefinition(id: number) {
    await this.request('DELETE', `/workflow-definitions/${id}`);
  }

  async cleanupE2eWorkflows() {
    const definitions = await this.listWorkflowDefinitions();
    for (const definition of definitions) {
      if (!definition.name.startsWith(E2E_WORKFLOW_NAME_PREFIX)) {
        continue;
      }
      if (definition.status === 'ACTIVE') {
        await this.deactivateWorkflowDefinition(definition.id);
      } else if (definition.status === 'DRAFT') {
        await this.deleteWorkflowDefinition(definition.id);
      }
      // INACTIVE definitions cannot be deleted in Fineract — leave for manual cleanup if needed.
    }
  }

  async createWorkflowDefinition(payload: Record<string, unknown>) {
    return this.request<{ resourceId?: number }>('POST', '/workflow-definitions', payload);
  }

  async activateWorkflowDefinition(id: number) {
    return this.request('POST', `/workflow-definitions/${id}?command=activate`, {});
  }

  async deactivateWorkflowDefinition(id: number) {
    return this.request('POST', `/workflow-definitions/${id}?command=deactivate`, {});
  }

  async getApprovalWorkflowsConfig(): Promise<GlobalConfiguration> {
    return this.request<GlobalConfiguration>(
      'GET',
      '/configurations/name/enable-approval-workflows'
    );
  }

  async setApprovalWorkflowsEnabled(enabled: boolean) {
    const config = await this.getApprovalWorkflowsConfig();
    await this.request('PUT', `/configurations/${config.id}`, { enabled });
    return { ...config, enabled };
  }

  buildDefaultLoanWorkflow(roleId: number, runSuffix: string) {
    return {
      moduleName: 'LOAN',
      name: e2eWorkflowName('Default Loan Approval', runSuffix),
      description: 'Two-stage default loan approval chain',
      priority: 10,
      stages: [
        {
          stageCode: 'BRANCH_REVIEW',
          name: 'Branch Review',
          stageType: 'REVIEW',
          requiredApprovals: 1,
          rejectionPolicy: 'ANY',
          escalationEnabled: false,
          allowCrossBranchAccess: false,
          requireDistinctApprover: true,
          actions: ['APPROVE', 'REJECT'],
          participants: [{ roleId }]
        },
        {
          stageCode: 'CREDIT_APPROVAL',
          name: 'Credit Approval',
          stageType: 'APPROVAL',
          requiredApprovals: 1,
          rejectionPolicy: 'ANY',
          escalationEnabled: false,
          allowCrossBranchAccess: false,
          requireDistinctApprover: true,
          actions: ['APPROVE', 'REJECT'],
          participants: [{ roleId }]
        }
      ],
      transitions: [
        {
          fromStageCode: 'BRANCH_REVIEW',
          toStageCode: 'CREDIT_APPROVAL',
          sequenceNo: 1
        }
      ]
    };
  }

  buildLargeLoanWorkflow(roleId: number, runSuffix: string, currencyCode = 'UGX') {
    return {
      moduleName: 'LOAN',
      name: e2eWorkflowName('Large Loan Approval', runSuffix),
      description: 'Loans of 5M and above require three approval levels',
      priority: 20,
      currencyCode,
      minAmount: 5_000_000,
      stages: [
        {
          stageCode: 'BRANCH_MANAGER',
          name: 'Branch Manager Review',
          stageType: 'REVIEW',
          requiredApprovals: 1,
          rejectionPolicy: 'ANY',
          expiryPeriodUnit: 'HOURS',
          expiryPeriodValue: 24,
          escalationEnabled: true,
          escalationTargetStageCode: 'REGIONAL_MANAGER',
          allowCrossBranchAccess: false,
          requireDistinctApprover: true,
          actions: ['APPROVE', 'REJECT', 'RETURN', 'ESCALATE'],
          participants: [{ roleId, approvalLimitAmount: 50_000_000, approvalLimitCurrency: currencyCode }]
        },
        {
          stageCode: 'REGIONAL_MANAGER',
          name: 'Regional Manager Review',
          stageType: 'APPROVAL',
          requiredApprovals: 1,
          rejectionPolicy: 'ANY',
          escalationEnabled: false,
          allowCrossBranchAccess: false,
          requireDistinctApprover: true,
          actions: ['APPROVE', 'REJECT'],
          participants: [{ roleId }]
        },
        {
          stageCode: 'CREDIT_COMMITTEE',
          name: 'Credit Committee',
          stageType: 'APPROVAL',
          requiredApprovals: 1,
          rejectionPolicy: 'ANY',
          escalationEnabled: false,
          allowCrossBranchAccess: false,
          requireDistinctApprover: true,
          actions: ['APPROVE', 'REJECT'],
          participants: [{ roleId }]
        }
      ],
      transitions: [
        {
          fromStageCode: 'BRANCH_MANAGER',
          toStageCode: 'REGIONAL_MANAGER',
          sequenceNo: 1
        },
        {
          fromStageCode: 'REGIONAL_MANAGER',
          toStageCode: 'CREDIT_COMMITTEE',
          sequenceNo: 2
        }
      ]
    };
  }

  buildCyclicDraftWorkflow(roleId: number, runSuffix: string) {
    return {
      moduleName: 'LOAN',
      name: e2eWorkflowName('Cyclic Draft', runSuffix),
      description: 'Intentionally cyclic draft for activation error testing',
      priority: 99,
      stages: [
        {
          stageCode: 'STAGE_A',
          name: 'Stage A',
          stageType: 'APPROVAL',
          requiredApprovals: 1,
          rejectionPolicy: 'ANY',
          escalationEnabled: false,
          actions: ['APPROVE', 'REJECT'],
          participants: [{ roleId }]
        },
        {
          stageCode: 'STAGE_B',
          name: 'Stage B',
          stageType: 'APPROVAL',
          requiredApprovals: 1,
          rejectionPolicy: 'ANY',
          escalationEnabled: false,
          actions: ['APPROVE', 'REJECT'],
          participants: [{ roleId }]
        }
      ],
      transitions: [
        { fromStageCode: 'STAGE_A', toStageCode: 'STAGE_B', sequenceNo: 1 },
        { fromStageCode: 'STAGE_B', toStageCode: 'STAGE_A', sequenceNo: 2 }
      ]
    };
  }
}

export async function createFineractE2eClient() {
  const client = new FineractE2eClient();
  await client.probeHealth();
  await client.authenticate();
  return client;
}
