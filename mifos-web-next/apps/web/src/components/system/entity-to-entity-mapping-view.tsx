'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  EntityMappingFilterOptions,
  FineractEntityMappingDetail,
  FineractEntityMappingRow,
  FineractEntityMappingType
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import {
  Building2,
  CircleDollarSign,
  Landmark,
  Network,
  Pencil,
  PiggyBank,
  Shield,
  Trash2,
  type LucideIcon
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  deleteEntityMappingAction,
  getEntityMappingAction,
  getEntityMappingFilterOptionsAction,
  listEntityMappingsForFilterAction
} from '@/actions/entity-to-entity-mapping';
import { DetailHeader, DetailPage, DetailSectionNav } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { EntityToEntityMappingFilterSheet } from '@/components/system/entity-to-entity-mapping-filter-sheet';
import { EntityToEntityMappingFormSheet } from '@/components/system/entity-to-entity-mapping-form-sheet';
import { EntityToEntityMappingGuidance } from '@/components/system/entity-to-entity-mapping-guidance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useDetailSection } from '@/hooks/use-detail-section';
import {
  entityMappingFilterLabels,
  entityMappingTypeIconKey,
  entityMappingTypeNavId,
  formatEntityMappingDate,
  formatEntityMappingTypeLabel
} from '@/lib/fineract/entity-mapping-display';

const ALL_OPTION = { value: '0', label: 'All' };

function filterSelectionLabel(
  options: EntityMappingFilterOptions['fromOptions'],
  id: string
): string {
  if (id === '0') {
    return ALL_OPTION.label;
  }
  return options.find((option) => String(option.id) === id)?.name ?? `#${id}`;
}

const MAPPING_TYPE_ICONS: Record<
  NonNullable<ReturnType<typeof entityMappingTypeIconKey>>,
  LucideIcon
> = {
  'office-loan': Building2,
  'office-savings': PiggyBank,
  'office-charge': CircleDollarSign,
  'office-department': Network,
  'role-loan': Shield,
  'role-savings': Landmark
};

export function EntityToEntityMappingView({
  mappingTypes,
  canCreate,
  canUpdate,
  canDelete
}: {
  mappingTypes: FineractEntityMappingType[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const sectionIds = useMemo(
    () => mappingTypes.map((type) => entityMappingTypeNavId(type)),
    [mappingTypes]
  );
  const defaultSection = sectionIds[0] ?? '';
  const { activeSection, setSection } = useDetailSection(sectionIds, defaultSection);
  const selectedTypeId = Number(activeSection);

  const [filterOptions, setFilterOptions] = useState<EntityMappingFilterOptions | null>(null);
  const [fromId, setFromId] = useState('0');
  const [toId, setToId] = useState('0');
  const [mappings, setMappings] = useState<FineractEntityMappingRow[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [optionsPending, startOptionsTransition] = useTransition();
  const [listPending, startListTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editMapId, setEditMapId] = useState<number | undefined>();
  const [editDetail, setEditDetail] = useState<FineractEntityMappingDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FineractEntityMappingRow | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const selectedType = mappingTypes.find((type) => type.id === selectedTypeId) ?? null;
  const filterLabels = selectedType ? entityMappingFilterLabels(selectedType.mappingTypes) : null;

  const filterSummary = useMemo(() => {
    if (!filterOptions) {
      return null;
    }
    return `${filterOptions.fromLabel}: ${filterSelectionLabel(filterOptions.fromOptions, fromId)} · ${filterOptions.toLabel}: ${filterSelectionLabel(filterOptions.toOptions, toId)}`;
  }, [filterOptions, fromId, toId]);

  const hasActiveFilter = fromId !== '0' || toId !== '0';

  const navItems = useMemo(
    () =>
      mappingTypes.map((type) => {
        const iconKey = entityMappingTypeIconKey(type.mappingTypes);
        return {
          id: entityMappingTypeNavId(type),
          label: formatEntityMappingTypeLabel(type.mappingTypes),
          icon: iconKey ? MAPPING_TYPE_ICONS[iconKey] : undefined
        };
      }),
    [mappingTypes]
  );

  const loadMappings = useCallback(() => {
    if (!Number.isFinite(selectedTypeId)) {
      return;
    }
    startListTransition(async () => {
      const result = await listEntityMappingsForFilterAction(
        selectedTypeId,
        Number(fromId),
        Number(toId)
      );
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setMappings(result.data ?? []);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    });
  }, [fromId, selectedTypeId, toId]);

  useEffect(() => {
    if (!selectedType || !Number.isFinite(selectedTypeId)) {
      setFilterOptions(null);
      setMappings([]);
      return;
    }

    setFromId('0');
    setToId('0');
    setMappings([]);
    setActionError(null);

    startOptionsTransition(async () => {
      const result = await getEntityMappingFilterOptionsAction({
        id: selectedType.id,
        mappingTypes: selectedType.mappingTypes
      });
      if (!result.ok) {
        setActionError(result.message);
        setFilterOptions(null);
        return;
      }
      setFilterOptions(result.data ?? null);

      const listResult = await listEntityMappingsForFilterAction(selectedType.id, 0, 0);
      if (!listResult.ok) {
        setActionError(listResult.message);
        return;
      }
      setMappings(listResult.data ?? []);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    });
  }, [selectedType, selectedTypeId]);

  const openEditForm = useCallback(
    (row: FineractEntityMappingRow) => {
      if (!canUpdate) {
        return;
      }
      setEditMapId(row.mapId);
      setEditDetail(null);
      setFormOpen(true);
      startListTransition(async () => {
        const result = await getEntityMappingAction(row.mapId);
        if (!result.ok) {
          setActionError(result.message);
          setFormOpen(false);
          return;
        }
        setEditDetail(result.data ?? null);
      });
    },
    [canUpdate]
  );

  function applyFilters(nextFromId: string, nextToId: string) {
    if (!Number.isFinite(selectedTypeId)) {
      return;
    }
    setActionError(null);
    setFromId(nextFromId);
    setToId(nextToId);
    startListTransition(async () => {
      const result = await listEntityMappingsForFilterAction(
        selectedTypeId,
        Number(nextFromId),
        Number(nextToId)
      );
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setMappings(result.data ?? []);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    });
  }

  function openCreateForm() {
    setEditMapId(undefined);
    setEditDetail(null);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startDeleteTransition(async () => {
      const result = await deleteEntityMappingAction(deleteTarget.mapId);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteTarget(null);
      loadMappings();
    });
  }

  const columns = useMemo<ColumnDef<FineractEntityMappingRow>[]>(() => {
    const fromLabel = filterOptions?.fromLabel ?? filterLabels?.fromLabel ?? 'From entity';
    const toLabel = filterOptions?.toLabel ?? filterLabels?.toLabel ?? 'To entity';

    return [
      {
        accessorKey: 'fromEntity',
        header: fromLabel
      },
      {
        accessorKey: 'toEntity',
        header: toLabel
      },
      {
        id: 'startDate',
        header: 'Start date',
        cell: ({ row }) => formatEntityMappingDate(row.original.startDate)
      },
      {
        id: 'endDate',
        header: 'End date',
        cell: ({ row }) => formatEntityMappingDate(row.original.endDate)
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {canUpdate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit mapping ${row.original.mapId}`}
                onClick={() => openEditForm(row.original)}
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label={`Delete mapping ${row.original.mapId}`}
                onClick={() => {
                  setActionError(null);
                  setDeleteTarget(row.original);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        )
      }
    ];
  }, [canDelete, canUpdate, filterLabels, filterOptions, openEditForm]);

  const table = useReactTable({
    data: mappings,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                Entity to entity mapping
                <EntityToEntityMappingGuidance />
              </span>
            }
            meta="Control which offices and roles can access loan products, savings products, and charges."
          />
        }
        sidebar={
          navItems.length > 0 ? (
            <DetailSectionNav items={navItems} activeId={activeSection} onSelect={setSection} />
          ) : undefined
        }
      >
        {mappingTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mapping types are configured.</p>
        ) : selectedType && filterLabels ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-medium">
                  {formatEntityMappingTypeLabel(selectedType.mappingTypes)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filterLabels.fromLabel} access to {filterLabels.toLabel.toLowerCase()}
                </p>
                {filterSummary ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {hasActiveFilter ? 'Filtered by ' : 'Showing '}
                    {filterSummary.toLowerCase()}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <ListFilterTrigger
                  activeCount={hasActiveFilter ? 1 : 0}
                  onClick={() => setFilterOpen(true)}
                  disabled={optionsPending || !filterOptions}
                  label="Filter"
                />
                {canCreate && filterOptions ? (
                  <Can permission="CREATE_ENTITYMAPPING">
                    <Button type="button" onClick={openCreateForm}>
                      Add mapping
                    </Button>
                  </Can>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {mappings.length} mapping{mappings.length === 1 ? '' : 's'}
              </p>
              <DataTable
                table={table}
                stickyHeader={false}
                isLoading={listPending || optionsPending}
                emptyMessage="No mappings found"
                emptyDescription="Adjust filters or add a new mapping."
              />
              <DataTablePagination table={table} totalRecords={mappings.length} />
            </div>
          </div>
        ) : null}

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      {filterOptions && selectedType ? (
        <EntityToEntityMappingFilterSheet
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filterOptions={filterOptions}
          fromId={fromId}
          toId={toId}
          onApply={applyFilters}
          pending={listPending}
          disabled={optionsPending}
        />
      ) : null}

      {filterOptions && selectedType ? (
        <EntityToEntityMappingFormSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          mappingTypeId={selectedType.id}
          filterOptions={filterOptions}
          mapId={editMapId}
          initialDetail={editDetail}
          onSaved={loadMappings}
        />
      ) : null}

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete mapping</DialogTitle>
            <DialogDescription>
              Delete mapping #{deleteTarget?.mapId} between &ldquo;{deleteTarget?.fromEntity}&rdquo;
              and &ldquo;{deleteTarget?.toEntity}&rdquo;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deletePending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
