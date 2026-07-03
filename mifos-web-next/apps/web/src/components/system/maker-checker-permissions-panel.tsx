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
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { updateMakerCheckerPermissionsAction } from '@/actions/maker-checker-permissions';
import { PermissionAssignmentStatus } from '@/components/system/permission-assignment-status';
import { PermissionCategoryCard } from '@/components/system/permission-category-card';
import { PermissionGroupingSidebar } from '@/components/system/permission-grouping-sidebar';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  countSelectedPermissions,
  filterAndGroupRolePermissions,
  filterPermissionsByAssignment,
  formatPermissionCode,
  formatRoleGroupingName,
  permissionsToPayload,
  type PermissionAssignmentFilter
} from '@/lib/fineract/role-display';

function resolveDefaultGrouping(
  groups: Array<{ grouping: string; permissions: FineractRolePermissionUsage[] }>
): string | null {
  if (groups.length === 0) {
    return null;
  }
  const withEnabled = groups.find((group) => countSelectedPermissions(group.permissions) > 0);
  return (withEnabled ?? groups[0]).grouping;
}

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
  const [assignmentFilter, setAssignmentFilter] = useState<PermissionAssignmentFilter>('assigned');
  const [selectedGrouping, setSelectedGrouping] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);

  const visiblePermissions = useMemo(() => {
    if (editing) {
      return permissions;
    }
    return filterPermissionsByAssignment(permissions, assignmentFilter);
  }, [permissions, editing, assignmentFilter]);

  const groupedPermissions = useMemo(
    () => filterAndGroupRolePermissions(visiblePermissions, search),
    [visiblePermissions, search]
  );

  const sidebarGroups = useMemo(() => {
    const groups = filterAndGroupRolePermissions(permissions, search);
    if (!editing && assignmentFilter === 'assigned') {
      return groups.filter((group) => countSelectedPermissions(group.permissions) > 0);
    }
    return groups;
  }, [permissions, search, editing, assignmentFilter]);

  useEffect(() => {
    if (
      selectedGrouping == null ||
      !groupedPermissions.some((group) => group.grouping === selectedGrouping)
    ) {
      setSelectedGrouping(resolveDefaultGrouping(groupedPermissions));
    }
  }, [groupedPermissions, selectedGrouping]);

  const activeGroup = useMemo(
    () => groupedPermissions.find((group) => group.grouping === selectedGrouping) ?? null,
    [groupedPermissions, selectedGrouping]
  );

  const enabledCount = useMemo(() => countSelectedPermissions(permissions), [permissions]);

  function togglePermission(code: string, selected: boolean) {
    setPermissions((current) =>
      current.map((permission) =>
        permission.code === code ? { ...permission, selected } : permission
      )
    );
  }

  function setGroupSelection(groupPermissions: FineractRolePermissionUsage[], selected: boolean) {
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
    setAssignmentFilter('assigned');
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
      toastCommandOutcome(result, {
        completed: 'Maker-checker tasks updated.',
        pending: 'Maker-checker tasks updated sent for approval.'
      });
      setEditing(false);
      setAssignmentFilter('assigned');
      router.refresh();
    });
  }

  const groupPermissions = activeGroup?.permissions ?? [];
  const groupEnabledCount = countSelectedPermissions(groupPermissions);
  const allEnabled =
    groupPermissions.length > 0 && groupPermissions.every((permission) => permission.selected);
  const someEnabled = groupPermissions.some((permission) => permission.selected);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-medium">Tasks</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? 'Enable tasks that require checker approval, then save your changes.'
                : canUpdate
                  ? 'Browse categories on the left to review enabled tasks. Select Edit tasks to make changes.'
                  : 'Browse categories on the left to review which actions require checker approval.'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Enabled <span className="font-medium text-foreground">{enabledCount}</span> /{' '}
            {permissions.length}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
            {!editing ? (
              <ToggleGroup
                value={[assignmentFilter]}
                onValueChange={(values) => {
                  const next = values[0];
                  if (next === 'all' || next === 'assigned') {
                    setAssignmentFilter(next);
                  }
                }}
                variant="outline"
                size="sm"
                aria-label="Task enablement filter"
              >
                <ToggleGroupItem value="assigned">Enabled only</ToggleGroupItem>
                <ToggleGroupItem value="all">All tasks</ToggleGroupItem>
              </ToggleGroup>
            ) : null}
          </div>
        </div>

        {canUpdate ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={pending}
                >
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
        <p className="text-sm text-muted-foreground">
          {assignmentFilter === 'assigned' && !search.trim()
            ? 'No maker-checker tasks are enabled.'
            : 'No tasks match your filters.'}
        </p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <PermissionGroupingSidebar
            groups={sidebarGroups}
            selectedGrouping={selectedGrouping}
            onSelect={setSelectedGrouping}
          />

          {activeGroup ? (
            <PermissionCategoryCard
              className="min-w-0 flex-1"
              header={
                <>
                  <div className="min-w-0">
                    <h3 className="text-base font-medium">
                      {formatRoleGroupingName(activeGroup.grouping)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {groupEnabledCount} of {groupPermissions.length} enabled
                      {!editing && assignmentFilter === 'assigned' ? ' (filtered)' : ''}
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
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          ) : null}
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
