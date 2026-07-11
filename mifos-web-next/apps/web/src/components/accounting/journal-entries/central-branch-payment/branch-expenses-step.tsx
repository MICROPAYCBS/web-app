'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseAmount } from '@mifos/domain';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { GL_ACCOUNT_TYPE_EXPENSE } from '@/lib/accounting/gl-account-display';
import { centralBranchExpensePaymentTotal } from '@/lib/accounting/central-branch-expense-payment';
import { formatJournalEntryGlAccountLabel } from '@/lib/accounting/journal-entry-display';
import type { CentralBranchPaymentStepProps } from './types';

function parseLineAmount(value: string): number {
  const decimal = parseAmount(value);
  return decimal ? decimal.toNumber() : 0;
}

export function BranchExpensesStep({
  form,
  errors,
  pending,
  onPatch,
  offices,
  glAccounts,
  departments,
  validationContext
}: CentralBranchPaymentStepProps) {
  const branchOptions = useMemo(
    () =>
      offices
        .filter((office) => office.id !== form.fundingOfficeId)
        .map((office) => ({
          value: String(office.id),
          label: office.name ?? office.nameDecorated ?? String(office.id)
        })),
    [form.fundingOfficeId, offices]
  );

  const expenseAccountOptions = useMemo(
    () =>
      glAccounts
        .filter((account) => account.typeId === GL_ACCOUNT_TYPE_EXPENSE)
        .map((account) => ({
          value: String(account.id),
          label: formatJournalEntryGlAccountLabel(account),
          keywords: [account.glCode, account.name]
        })),
    [glAccounts]
  );

  const sourceOfficeName =
    offices.find((office) => office.id === form.fundingOfficeId)?.name ??
    offices.find((office) => office.id === form.fundingOfficeId)?.nameDecorated ??
    'the source office';

  const total = centralBranchExpensePaymentTotal(form.expenseLines);
  const requireDepartment = validationContext.requireDepartmentOnExpenseLines === true;

  function patchLine(
    index: number,
    patch: Partial<(typeof form.expenseLines)[number]>
  ) {
    onPatch({
      expenseLines: form.expenseLines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line
      )
    });
  }

  function addLine() {
    onPatch({
      expenseLines: [
        ...form.expenseLines,
        { branchOfficeId: 0, expenseGlAccountId: 0, amount: 0 }
      ]
    });
  }

  function removeLine(index: number) {
    if (form.expenseLines.length <= 1) {
      return;
    }
    onPatch({
      expenseLines: form.expenseLines.filter((_, lineIndex) => lineIndex !== index)
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Branch debits post at each consuming office. Credits consolidate at{' '}
        <span className="font-medium text-foreground">{sourceOfficeName}</span> only.
      </div>

      {errors.expenseLines ? (
        <p className="text-sm text-destructive">{errors.expenseLines}</p>
      ) : null}

      <div className="space-y-4">
        {form.expenseLines.map((line, index) => {
          const departmentOptions = departments
            .filter((department) => department.active !== false)
            .filter(
              (department) =>
                department.officeId == null ||
                line.branchOfficeId <= 0 ||
                department.officeId === line.branchOfficeId
            )
            .map((department) => ({
              value: String(department.id),
              label: department.departmentName,
              keywords: [department.departmentCode]
            }));

          return (
            <div
              key={`expense-line-${index}`}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Line {index + 1}</h3>
                {form.expenseLines.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(index)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Branch"
                  required
                  value={line.branchOfficeId > 0 ? String(line.branchOfficeId) : undefined}
                  onValueChange={(value) => {
                    const branchOfficeId = value ? Number(value) : 0;
                    const patch: Partial<(typeof line)> = { branchOfficeId };
                    if (
                      line.departmentId != null &&
                      departments.some(
                        (department) =>
                          department.id === line.departmentId &&
                          department.officeId != null &&
                          department.officeId !== branchOfficeId
                      )
                    ) {
                      patch.departmentId = undefined;
                    }
                    patchLine(index, patch);
                  }}
                  options={branchOptions}
                  placeholder="Select branch"
                  disabled={pending}
                  error={errors[`expenseLines.${index}.branchOfficeId`]}
                />
                <SelectField
                  label="Debit account"
                  required
                  value={line.expenseGlAccountId > 0 ? String(line.expenseGlAccountId) : undefined}
                  onValueChange={(value) =>
                    patchLine(index, { expenseGlAccountId: value ? Number(value) : 0 })
                  }
                  options={expenseAccountOptions}
                  placeholder="Select GL account"
                  disabled={pending}
                  error={errors[`expenseLines.${index}.expenseGlAccountId`]}
                />
                <MoneyField
                  label="Amount"
                  required
                  currencyCode={form.currencyCode}
                  value={line.amount > 0 ? String(line.amount) : ''}
                  onChange={(value) => patchLine(index, { amount: parseLineAmount(value) })}
                  disabled={pending}
                  error={errors[`expenseLines.${index}.amount`]}
                />
                <SelectField
                  label="Department"
                  optional={!requireDepartment}
                  required={requireDepartment}
                  value={line.departmentId != null ? String(line.departmentId) : undefined}
                  onValueChange={(value) =>
                    patchLine(index, { departmentId: value ? Number(value) : undefined })
                  }
                  options={departmentOptions}
                  placeholder="None"
                  disabled={pending}
                  error={errors[`expenseLines.${index}.departmentId`]}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={addLine} disabled={pending}>
        <Plus className="mr-2 size-4" />
        Add line
      </Button>

      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold tabular-nums">
          {form.currencyCode} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {total <= 0 ? (
        <div className="flex items-start gap-2 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Add at least one line with an amount greater than zero.</span>
        </div>
      ) : null}
    </div>
  );
}
