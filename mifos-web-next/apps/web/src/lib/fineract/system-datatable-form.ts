/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader, FineractDatatableDefinition } from '@mifos/api-client';
import type {
  SystemDatatableColumnInput,
  SystemDatatableColumnType,
  UpdateSystemDatatableInput
} from '@mifos/validation';
import type { SelectOption } from '@/components/composites/select-field';
import { filterSystemColumns, isSystemColumn } from '@/lib/fineract/datatables';

export const APPLICATION_TABLE_OPTIONS: SelectOption[] = [
  { value: 'm_client', label: 'Customer' },
  { value: 'm_group', label: 'Group' },
  { value: 'm_center', label: 'Center' },
  { value: 'm_office', label: 'Office' },
  { value: 'm_loan', label: 'Loan account' },
  { value: 'm_savings_account', label: 'Savings account' },
  { value: 'm_product_loan', label: 'Loan product' },
  { value: 'm_savings_account_transaction', label: 'Savings account transaction' },
  { value: 'm_savings_product', label: 'Deposit product' },
  { value: 'm_share_product', label: 'Share product' }
];

export const ENTITY_SUB_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Person', label: 'Person' },
  { value: 'Entity', label: 'Entity' }
];

export const SAVINGS_SUB_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Savings Product', label: 'Deposit product' },
  { value: 'Fixed Deposit', label: 'Fixed deposit' },
  { value: 'Recurring Deposit', label: 'Recurring deposit' }
];

export const COLUMN_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Date', label: 'Date' },
  { value: 'Datetime', label: 'Date and time' },
  { value: 'Decimal', label: 'Decimal' },
  { value: 'Dropdown', label: 'Dropdown' },
  { value: 'Number', label: 'Number' },
  { value: 'String', label: 'String' },
  { value: 'Text', label: 'Text' }
];

const RELATIONSHIP_COLUMN_BY_APP_TABLE: Record<string, string> = {
  m_client: 'client_id',
  m_group: 'group_id',
  m_center: 'center_id',
  m_office: 'office_id',
  m_loan: 'loan_id',
  m_savings_account: 'savings_account_id',
  m_savings_account_transaction: 'savings_transaction_id',
  m_product_loan: 'product_loan_id',
  m_savings_product: 'savings_product_id',
  m_share_product: 'share_product_id'
};

export type SystemDatatableColumnKind = 'new' | 'existing' | 'system';

export interface SystemDatatableColumnDraft {
  columnName: string;
  columnDisplayType: SystemDatatableColumnType;
  isColumnNullable: boolean;
  isColumnUnique?: boolean;
  isColumnIndexed?: boolean;
  columnLength?: number | string;
  columnCode?: string;
  /** Optional string validation metadata (stored in x_table_column_validation). */
  validationRegex?: string;
  validationExample?: string;
  validationMessage?: string;
  kind: SystemDatatableColumnKind;
  /** Stable name for existing columns after renames (edit mode). */
  originalColumnName?: string;
}

export function getRelationshipColumnName(applicationTableName?: string): string {
  if (!applicationTableName) {
    return '';
  }
  return RELATIONSHIP_COLUMN_BY_APP_TABLE[applicationTableName] ?? '';
}

export function isSystemDatatableColumn(columnName: string): boolean {
  return isSystemColumn(columnName);
}

/** User-managed columns only — hides id, timestamps, and entity link columns. */
export function filterUserDatatableColumns(
  columns: FineractDatatableColumnHeader[]
): FineractDatatableColumnHeader[] {
  return filterSystemColumns(columns);
}

export function toUiColumnType(columnDisplayType: string): SystemDatatableColumnType {
  switch (columnDisplayType) {
    case 'INTEGER':
      return 'Number';
    case 'CODELOOKUP':
      return 'Dropdown';
    case 'DATETIME':
      return 'Datetime';
    default:
      if (!columnDisplayType) {
        return 'String';
      }
      return (columnDisplayType.charAt(0) + columnDisplayType.slice(1).toLowerCase()) as SystemDatatableColumnType;
  }
}

export function toDraftFromHeader(
  column: FineractDatatableColumnHeader,
  applicationTableName?: string,
  kind: SystemDatatableColumnKind = 'existing'
): SystemDatatableColumnDraft {
  return {
    columnName: column.columnName,
    columnDisplayType: toUiColumnType(column.columnDisplayType),
    isColumnNullable: column.isColumnNullable !== false,
    isColumnUnique: column.isColumnUnique,
    isColumnIndexed: column.isColumnIndexed,
    columnLength: column.columnLength,
    columnCode: column.columnCode,
    validationRegex: column.validationRegex,
    validationExample: column.validationExample,
    validationMessage: column.validationMessage,
    kind: isSystemColumn(column.columnName) ? 'system' : kind,
    originalColumnName: column.columnName
  };
}

export function prepareEditColumns(definition: FineractDatatableDefinition): SystemDatatableColumnDraft[] {
  const applicationTableName = definition.applicationTableName;
  const headers = filterUserDatatableColumns(definition.columnHeaderData ?? []);

  return headers.map((column) => toDraftFromHeader(column, applicationTableName, 'existing'));
}

export function filterEditableColumnDrafts(
  columns: SystemDatatableColumnDraft[]
): SystemDatatableColumnDraft[] {
  return columns.filter((column) => !isSystemColumn(column.columnName));
}

export function draftToColumnInput(column: SystemDatatableColumnDraft): SystemDatatableColumnInput {
  return {
    name: column.columnName,
    type: column.columnDisplayType,
    mandatory: column.isColumnNullable === false,
    unique: column.isColumnUnique ?? false,
    indexed: column.isColumnIndexed ?? false,
    length:
      column.columnDisplayType === 'String' && column.columnLength != null
        ? Number(column.columnLength)
        : undefined,
    code: column.columnDisplayType === 'Dropdown' ? column.columnCode : undefined
  };
}

export function buildUpdatePayload(
  initialColumns: SystemDatatableColumnDraft[],
  currentColumns: SystemDatatableColumnDraft[],
  apptableName: string,
  entitySubType?: string
): UpdateSystemDatatableInput {
  const editableInitial = filterEditableColumnDrafts(initialColumns);
  const editableCurrent = filterEditableColumnDrafts(currentColumns);

  const initialByName = new Map(
    editableInitial.map((column) => [column.originalColumnName ?? column.columnName, column])
  );

  const dropColumns = editableInitial
    .filter((column) => {
      if (column.kind !== 'existing') {
        return false;
      }
      const lookupName = column.originalColumnName ?? column.columnName;
      return !editableCurrent.some(
        (current) =>
          current.kind === 'existing' &&
          (current.originalColumnName ?? current.columnName) === lookupName
      );
    })
    .map((column) => ({ name: column.originalColumnName ?? column.columnName }));

  const addColumns = editableCurrent
    .filter((column) => column.kind === 'new')
    .map((column) => draftToColumnInput(column));

  const changeColumns = editableCurrent
    .filter((column) => column.kind === 'existing')
    .flatMap((column) => {
      const lookupName = column.originalColumnName ?? column.columnName;
      const initial = initialByName.get(lookupName);
      if (!initial) {
        return [];
      }
      const newName = column.columnName !== lookupName ? column.columnName : undefined;
      const newCode =
        column.columnCode !== initial.columnCode ? column.columnCode : undefined;
      const mandatoryChanged = column.isColumnNullable !== initial.isColumnNullable;
      const lengthChanged = column.columnLength !== initial.columnLength;

      if (!newName && !newCode && !mandatoryChanged && !lengthChanged) {
        return [];
      }

      return [
        {
          name: lookupName,
          newName,
          code: initial.columnCode,
          newCode,
          mandatory: column.isColumnNullable === false,
          length:
            column.columnDisplayType === 'String' && column.columnLength != null
              ? Number(column.columnLength)
              : undefined
        }
      ];
    });

  const payload: UpdateSystemDatatableInput = {
    apptableName,
    entitySubType: entitySubType?.trim() || undefined,
    addColumns: addColumns.length ? addColumns : undefined,
    changeColumns: changeColumns.length ? changeColumns : undefined,
    dropColumns: dropColumns.length ? dropColumns : undefined
  };

  return payload;
}

export function sanitizeUpdatePayload(
  payload: UpdateSystemDatatableInput
): UpdateSystemDatatableInput {
  return {
    ...payload,
    addColumns: payload.addColumns?.filter((column) => !isSystemColumn(column.name)),
    changeColumns: payload.changeColumns?.filter(
      (column) =>
        !isSystemColumn(column.name) &&
        (!column.newName || !isSystemColumn(column.newName))
    ),
    dropColumns: payload.dropColumns?.filter((column) => !isSystemColumn(column.name))
  };
}

export function entitySubTypeOptionsForAppTable(appTableName: string): SelectOption[] {
  if (appTableName === 'm_client') {
    return ENTITY_SUB_TYPE_OPTIONS;
  }
  if (appTableName === 'm_savings_product') {
    return SAVINGS_SUB_TYPE_OPTIONS;
  }
  return [];
}

export function showEntitySubTypeField(appTableName: string): boolean {
  return appTableName === 'm_client' || appTableName === 'm_savings_product';
}

export interface SystemDatatableColumnValidationInput {
  columnName: string;
  validationRegex?: string;
  validationExample?: string;
  validationMessage?: string;
}

export function isStringLikeColumnType(type: SystemDatatableColumnType): boolean {
  return type === 'String' || type === 'Text';
}

export function columnValidationsFromDrafts(
  columns: SystemDatatableColumnDraft[]
): SystemDatatableColumnValidationInput[] {
  return filterEditableColumnDrafts(columns)
    .filter((column) => isStringLikeColumnType(column.columnDisplayType))
    .map((column) => ({
      columnName: column.columnName,
      validationRegex: column.validationRegex?.trim() || undefined,
      validationExample: column.validationExample?.trim() || undefined,
      validationMessage: column.validationMessage?.trim() || undefined
    }));
}

export function buildColumnValidationDeleteNames(
  initialColumns: SystemDatatableColumnDraft[],
  currentColumns: SystemDatatableColumnDraft[]
): string[] {
  const editableInitial = filterEditableColumnDrafts(initialColumns);
  const editableCurrent = filterEditableColumnDrafts(currentColumns);
  const currentNames = new Set(
    editableCurrent.map((column) => (column.originalColumnName ?? column.columnName).toLowerCase())
  );

  const dropped = editableInitial
    .filter((column) => {
      const lookupName = column.originalColumnName ?? column.columnName;
      return !currentNames.has(lookupName.toLowerCase());
    })
    .map((column) => column.originalColumnName ?? column.columnName);

  const renamed = editableCurrent
    .filter((column) => {
      const lookupName = column.originalColumnName ?? column.columnName;
      return column.columnName.toLowerCase() !== lookupName.toLowerCase();
    })
    .map((column) => column.originalColumnName ?? column.columnName);

  return [...new Set([...dropped, ...renamed])];
}
