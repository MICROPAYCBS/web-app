'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProvisioningCriteriaGlAccount } from '@mifos/api-client';
import type { ProvisioningCriteriaDefinitionInput } from '@mifos/validation';
import { isProvisioningDefinitionComplete } from '@mifos/validation';
import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProvisioningCriteriaDefinitionDialog } from '@/components/organization/provisioning-criteria-definition-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { resolveProvisioningGlAccountLabel } from '@/lib/fineract/provisioning-criteria-display';

type DefinitionDraft = Partial<ProvisioningCriteriaDefinitionInput> & {
  categoryId: number;
  categoryName: string;
};

function displayValue(value: number | undefined): string {
  return value != null && Number.isFinite(value) ? String(value) : '—';
}

export function ProvisioningCriteriaDefinitionsEditor({
  definitions,
  glAccounts,
  onChange,
  requireAllComplete = false
}: {
  definitions: DefinitionDraft[];
  glAccounts: ProvisioningCriteriaGlAccount[];
  onChange: (definitions: DefinitionDraft[]) => void;
  requireAllComplete?: boolean;
}) {
  const [editing, setEditing] = useState<DefinitionDraft | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const completeCount = useMemo(
    () => definitions.filter((definition) => isProvisioningDefinitionComplete(definition)).length,
    [definitions]
  );

  function openEditor(definition: DefinitionDraft) {
    setEditing(definition);
    setDialogOpen(true);
  }

  function handleConfirm(value: ProvisioningCriteriaDefinitionInput) {
    onChange(
      definitions.map((definition) =>
        definition.categoryId === value.categoryId ? { ...definition, ...value } : definition
      )
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Provisioning definitions</h3>
        {requireAllComplete ? (
          <p className="text-sm text-muted-foreground">
            {completeCount} of {definitions.length} configured
          </p>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Min age</TableHead>
              <TableHead>Max age</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Liability account</TableHead>
              <TableHead>Expense account</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {definitions.map((definition) => (
              <TableRow key={definition.categoryId}>
                <TableCell className="font-medium">{definition.categoryName}</TableCell>
                <TableCell>{displayValue(definition.minAge)}</TableCell>
                <TableCell>{displayValue(definition.maxAge)}</TableCell>
                <TableCell>{displayValue(definition.provisioningPercentage)}</TableCell>
                <TableCell>
                  {resolveProvisioningGlAccountLabel(glAccounts, definition.liabilityAccount)}
                </TableCell>
                <TableCell>
                  {resolveProvisioningGlAccountLabel(glAccounts, definition.expenseAccount)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditor(definition)}
                  >
                    <Pencil className="mr-1 size-4" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {requireAllComplete && completeCount < definitions.length ? (
        <p className="text-sm text-muted-foreground">
          Please fill all provisioning criteria definitions before submitting.
        </p>
      ) : null}
      <ProvisioningCriteriaDefinitionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        definition={editing}
        glAccounts={glAccounts}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
