'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateRolePermissionsAction } from '@/actions/system-roles';
import { PermissionAssignmentStatus } from '@/components/system/permission-assignment-status';
import { PermissionCategoryCard } from '@/components/system/permission-category-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  countSelectedPermissions,
  filterAndGroupRolePermissions,
  formatPermissionCode,
  formatRoleGroupingName,
  permissionsToPayload
} from '@/lib/fineract/role-display';

export function RolePermissionsPanel({
  roleId,
  permissions: initialPermissions,
  canEdit
}: {
  roleId: number;
  permissions: FineractRolePermissionUsage[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [permissions, setPermissions] = useState(initialPermissions);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);

  const groupedPermissions = useMemo(
    () => filterAndGroupRolePermissions(permissions, search),
    [permissions, search]
  );

  const selectedCount = useMemo(() => countSelectedPermissions(permissions), [permissions]);

  function togglePermission(code: string, selected: boolean) {
    setPermissions((current) =>
      current.map((permission) =>
        permission.code === code ? { ...permission, selected } : permission
      )
    );
  }

  function setGroupSelection(
    groupPermissions: FineractRolePermissionUsage[],
    selected: boolean
  ) {
    const codes = new Set(groupPermissions.map((permission) => permission.code));
    setPermissions((current) =>
      current.map((permission) =>
        codes.has(permission.code) ? { ...permission, selected } : permission
      )
    );
  }

  function handleCancelEdit() {
    setPermissions(initialPermissions);
    setEditing(false);
    setSubmitError(null);
  }

  function handleSave() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await updateRolePermissionsAction(roleId, {
        permissions: permissionsToPayload(permissions)
      });
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      toast.success('Permissions updated.');
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-medium">Permissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? 'Select the actions this role can perform, then save your changes.'
                : canEdit
                  ? 'Review assigned actions. Select Edit permissions to make changes.'
                  : 'Review the actions assigned to this role.'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Selected{' '}
            <span className="font-medium text-foreground">{selectedCount}</span> /{' '}
            {permissions.length}
          </p>
          <div className="relative w-full max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Search permissions…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              aria-label="Search permissions"
            />
          </div>
        </div>

        {canEdit ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {editing ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={pending}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={pending}>
                  {pending ? 'Saving…' : 'Save permissions'}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setEditing(true)}>
                Edit permissions
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {permissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No permissions are available.</p>
      ) : groupedPermissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No permissions match your search.</p>
      ) : (
        <div className="space-y-4">
          {groupedPermissions.map(({ grouping, permissions: groupPermissions }) => {
            const groupSelectedCount = countSelectedPermissions(groupPermissions);
            const allSelected =
              groupPermissions.length > 0 &&
              groupPermissions.every((permission) => permission.selected);
            const someSelected = groupPermissions.some((permission) => permission.selected);

            return (
              <PermissionCategoryCard
                key={grouping}
                header={
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      {editing ? (
                        <Checkbox
                          id={`permission-group-${grouping}`}
                          checked={allSelected}
                          onCheckedChange={(checked) =>
                            setGroupSelection(groupPermissions, checked === true)
                          }
                          disabled={pending}
                          aria-label={`Select all ${formatRoleGroupingName(grouping)} permissions`}
                        />
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="text-base font-medium">
                          {formatRoleGroupingName(grouping)}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {groupSelectedCount} of {groupPermissions.length} selected
                        </p>
                      </div>
                    </div>

                    {editing && groupPermissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setGroupSelection(groupPermissions, true)}
                          disabled={allSelected || pending}
                        >
                          Select all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setGroupSelection(groupPermissions, false)}
                          disabled={!someSelected || pending}
                        >
                          Deselect all
                        </Button>
                      </div>
                    ) : null}
                  </>
                }
              >
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupPermissions.map((permission) => {
                    const checkboxId = `permission-${permission.code}`;
                    const label = formatPermissionCode(permission.code, permission.grouping);
                    return (
                      <li key={permission.code}>
                        <div className="flex h-full items-start justify-between gap-3 rounded-md bg-muted/40 p-3 transition-colors hover:bg-muted/60">
                          {editing ? (
                            <Checkbox
                              id={checkboxId}
                              checked={permission.selected}
                              onCheckedChange={(checked) =>
                                togglePermission(permission.code, checked === true)
                              }
                              disabled={pending}
                            />
                          ) : null}
                          <Field orientation="vertical" className="min-w-0 flex-1 gap-1">
                            <FieldContent>
                              <FieldLabel
                                htmlFor={editing ? checkboxId : undefined}
                                className="font-normal"
                              >
                                {label}
                              </FieldLabel>
                              <p className="font-mono text-xs text-muted-foreground">
                                {permission.code}
                              </p>
                            </FieldContent>
                          </Field>
                          {!editing ? (
                            <PermissionAssignmentStatus
                              active={permission.selected}
                              activeLabel="Assigned"
                              inactiveLabel="Not assigned"
                            />
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </PermissionCategoryCard>
            );
          })}
        </div>
      )}

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}
    </div>
  );
}
