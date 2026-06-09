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
import { updateMakerCheckerPermissionsAction } from '@/actions/maker-checker-permissions';
import { PermissionAssignmentStatus } from '@/components/system/permission-assignment-status';
import { PermissionCategoryCard } from '@/components/system/permission-category-card';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  countSelectedPermissions,
  filterAndGroupRolePermissions,
  formatPermissionCode,
  formatRoleGroupingName,
  permissionsToPayload
} from '@/lib/fineract/role-display';

export function MakerCheckerPermissionsPanel({
  permissions: initialPermissions,
  canUpdate
}: {
  permissions: FineractRolePermissionUsage[];
  canUpdate: boolean;
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

  const enabledCount = useMemo(() => countSelectedPermissions(permissions), [permissions]);

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
      const result = await updateMakerCheckerPermissionsAction({
        permissions: permissionsToPayload(permissions)
      });
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message));
        return;
      }
      toast.success('Maker-checker tasks updated.');
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enabled{' '}
            <span className="font-medium text-foreground">{enabledCount}</span> /{' '}
            {permissions.length}
            {canUpdate && !editing ? (
              <span className="mt-1 block text-xs">
                Select <span className="font-medium text-foreground">Edit tasks</span> to change
                which actions require checker approval.
              </span>
            ) : null}
          </p>
          <div className="relative w-full max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              aria-label="Search maker-checker tasks"
            />
          </div>
        </div>

        {canUpdate ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {editing ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={pending}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={pending}>
                  {pending ? 'Saving…' : 'Save changes'}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setEditing(true)}>
                Edit tasks
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {permissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No maker-checker tasks are available.</p>
      ) : groupedPermissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks match your search.</p>
      ) : (
        <div className="space-y-4">
          {groupedPermissions.map(({ grouping, permissions: groupPermissions }) => {
            const groupEnabledCount = countSelectedPermissions(groupPermissions);
            const allEnabled =
              groupPermissions.length > 0 &&
              groupPermissions.every((permission) => permission.selected);
            const someEnabled = groupPermissions.some((permission) => permission.selected);

            return (
              <PermissionCategoryCard
                key={grouping}
                header={
                  <>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium">{formatRoleGroupingName(grouping)}</h3>
                      <p className="text-xs text-muted-foreground">
                        {groupEnabledCount} of {groupPermissions.length} enabled
                      </p>
                    </div>

                    {editing && groupPermissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setGroupSelection(groupPermissions, true)}
                          disabled={allEnabled || pending}
                        >
                          Enable all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setGroupSelection(groupPermissions, false)}
                          disabled={!someEnabled || pending}
                        >
                          Disable all
                        </Button>
                      </div>
                    ) : null}
                  </>
                }
              >
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupPermissions.map((permission) => {
                    const switchId = `maker-checker-${permission.code}`;
                    const label = formatPermissionCode(permission.code, permission.grouping);
                    return (
                      <li key={permission.code}>
                        <div className="flex h-full items-start justify-between gap-3 rounded-md bg-muted/40 p-3 transition-colors hover:bg-muted/60">
                          <Field orientation="vertical" className="min-w-0 flex-1 gap-1">
                            <FieldContent>
                              <FieldLabel
                                htmlFor={editing ? switchId : undefined}
                                className="font-normal"
                              >
                                {label}
                              </FieldLabel>
                              <p className="font-mono text-xs text-muted-foreground">
                                {permission.code}
                              </p>
                            </FieldContent>
                          </Field>
                          {editing ? (
                            <Switch
                              id={switchId}
                              checked={permission.selected}
                              onCheckedChange={(checked) =>
                                togglePermission(permission.code, checked)
                              }
                              disabled={pending}
                              aria-label={`${permission.selected ? 'Disable' : 'Enable'} ${label}`}
                            />
                          ) : (
                            <PermissionAssignmentStatus
                              active={permission.selected}
                              activeLabel="Enabled"
                              inactiveLabel="Disabled"
                            />
                          )}
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
