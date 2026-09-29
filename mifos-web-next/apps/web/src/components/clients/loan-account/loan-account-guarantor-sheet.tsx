'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, GUARANTOR_TYPE_CUSTOMER, GUARANTOR_TYPE_EXTERNAL } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import {
  createLoanGuarantorAction,
  loadLoanGuarantorSavingsAction,
  loadLoanGuarantorTemplateAction,
  updateLoanGuarantorAction
} from '@/actions/loan-guarantor';
import { CustomerSearchField } from '@/components/clients/loan-account/customer-search-field';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import {
  loanGuaranteeShortfall,
  loanGuarantorOwnSavingsIssue,
  loanGuarantorTypeNeedsEntity
} from '@/lib/fineract/loan-guarantor-display';
import type {
  LoanGuaranteeSettings,
  LoanGuarantorRecord,
  LoanGuarantorRelationshipOption,
  LoanGuarantorSavingsAccountOption,
  LoanGuarantorTypeOption
} from '@/lib/fineract/loan-account-types';

const CREATE_TOAST = {
  completed: 'Guarantor added.',
  pending: 'Guarantor submitted for approval.'
};

const UPDATE_TOAST = {
  completed: 'Guarantor updated.',
  pending: 'Guarantor update submitted for approval.'
};

const FALLBACK_TYPES: LoanGuarantorTypeOption[] = [
  { id: 1, value: 'CUSTOMER', code: 'guarantor.existing.customer' },
  { id: 2, value: 'STAFF', code: 'guarantor.staff' },
  { id: 3, value: 'EXTERNAL', code: 'guarantor.external' },
  { id: 4, value: 'GROUP', code: 'guarantor.existing.group' }
];

function savingsLabel(account: LoanGuarantorSavingsAccountOption): string {
  return [account.accountNo, account.productName, account.currencyCode].filter(Boolean).join(' · ');
}

export function LoanAccountGuarantorSheet({
  clientId,
  accountId,
  loanProductId,
  borrowerClientId,
  principal,
  currencyCode,
  existingGuarantors = [],
  open,
  onOpenChange,
  editing
}: {
  clientId: string;
  accountId: number;
  loanProductId?: number;
  borrowerClientId?: number;
  principal?: number;
  currencyCode?: string;
  existingGuarantors?: LoanGuarantorRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: LoanGuarantorRecord | null;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<LoanGuarantorTypeOption[]>(FALLBACK_TYPES);
  const [relationships, setRelationships] = useState<LoanGuarantorRelationshipOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ id: number; name: string }[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ id: number; name: string }[]>([]);
  const [guarantee, setGuarantee] = useState<LoanGuaranteeSettings>({ holdGuaranteeFunds: false });
  const [loadedGuarantors, setLoadedGuarantors] = useState<LoanGuarantorRecord[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<LoanGuarantorSavingsAccountOption[]>([]);
  const [savingsLoading, setSavingsLoading] = useState(false);
  const [guarantorTypeId, setGuarantorTypeId] = useState('1');
  const [entityId, setEntityId] = useState('');
  const [entityLabel, setEntityLabel] = useState('');
  const [relationshipId, setRelationshipId] = useState('');
  const [savingsId, setSavingsId] = useState('');
  const [amount, setAmount] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zip, setZip] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [housePhoneNumber, setHousePhoneNumber] = useState('');
  const [comment, setComment] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const typeId = Number(guarantorTypeId) || GUARANTOR_TYPE_CUSTOMER;
  const external = typeId === GUARANTOR_TYPE_EXTERNAL;
  const isCustomer = typeId === GUARANTOR_TYPE_CUSTOMER;
  const editingExternal = editing?.guarantorTypeId === GUARANTOR_TYPE_EXTERNAL;

  function applyRecord(row?: LoanGuarantorRecord | null) {
    setGuarantorTypeId(String(row?.guarantorTypeId ?? GUARANTOR_TYPE_CUSTOMER));
    setEntityId(row?.entityId != null ? String(row.entityId) : '');
    setEntityLabel(row ? [row.firstname, row.lastname].filter(Boolean).join(' ') : '');
    setRelationshipId(row?.clientRelationshipTypeId != null ? String(row.clientRelationshipTypeId) : '');
    setSavingsId('');
    setAmount('');
    setFirstname(row?.firstname ?? '');
    setLastname(row?.lastname ?? '');
    setAddressLine1(row?.addressLine1 ?? '');
    setAddressLine2(row?.addressLine2 ?? '');
    setCity(row?.city ?? '');
    setState(row?.state ?? '');
    setCountry(row?.country ?? '');
    setZip(row?.zip ?? '');
    setMobileNumber(row?.mobileNumber ?? '');
    setHousePhoneNumber(row?.housePhoneNumber ?? '');
    setComment(row?.comment ?? '');
    setDob(row?.dob ?? '');
    setError(null);
    setFieldErrors({});
    setSavingsAccounts([]);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    applyRecord(editing);
    let cancelled = false;
    setLoading(true);
    void loadLoanGuarantorTemplateAction(accountId, loanProductId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.guarantorTypeOptions.length) {
        setTypes(result.guarantorTypeOptions);
      }
      setRelationships(result.relationshipOptions);
      setStaffOptions(result.staffOptions);
      setGroupOptions(result.groupOptions);
      setGuarantee(result.guarantee);
      setLoadedGuarantors(result.guarantors);
      if (!editing && result.defaultGuarantorTypeId != null) {
        setGuarantorTypeId(String(result.defaultGuarantorTypeId));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, editing, loanProductId, open]);

  useEffect(() => {
    if (!open || editing || !guarantee.holdGuaranteeFunds || !isCustomer || !entityId) {
      setSavingsAccounts([]);
      return;
    }
    let cancelled = false;
    setSavingsLoading(true);
    void loadLoanGuarantorSavingsAction(accountId, Number(entityId)).then((result) => {
      if (cancelled) {
        return;
      }
      setSavingsLoading(false);
      setSavingsAccounts(result.ok ? result.accounts : []);
      if (!result.ok) {
        setError(result.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, editing, entityId, guarantee.holdGuaranteeFunds, isCustomer, open]);

  const relationshipOptions = useMemo(
    () => relationships.map((item) => ({ value: String(item.id), label: item.name })),
    [relationships]
  );
  const typeOptions = useMemo(
    () => types.map((item) => ({ value: String(item.id), label: item.value })),
    [types]
  );
  const staffSelectOptions = useMemo(
    () => staffOptions.map((item) => ({ value: String(item.id), label: item.name })),
    [staffOptions]
  );
  const groupSelectOptions = useMemo(
    () => groupOptions.map((item) => ({ value: String(item.id), label: item.name })),
    [groupOptions]
  );
  const savingsOptions = useMemo(
    () =>
      savingsAccounts.map((account) => ({
        value: String(account.id),
        label: savingsLabel(account) || `Account ${account.id}`
      })),
    [savingsAccounts]
  );

  const pendingPledge = useMemo(() => {
    const pledged = Number(amount);
    if (!guarantee.holdGuaranteeFunds || !savingsId || !Number.isFinite(pledged) || pledged <= 0) {
      return undefined;
    }
    const own =
      isCustomer && borrowerClientId != null && Number(entityId) === borrowerClientId;
    return own ? { ownFunds: pledged } : { other: pledged };
  }, [amount, borrowerClientId, entityId, guarantee.holdGuaranteeFunds, isCustomer, savingsId]);

  const shortfall = loanGuaranteeShortfall({
    principal,
    thresholds: guarantee,
    guarantors: loadedGuarantors.length > 0 ? loadedGuarantors : existingGuarantors,
    borrowerClientId,
    pending: pendingPledge
  });

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setFieldErrors({});
    const ownSavingsIssue = editing
      ? null
      : loanGuarantorOwnSavingsIssue({
          guarantorTypeId: typeId,
          entityId: entityId ? Number(entityId) : undefined,
          borrowerClientId,
          savingsId: savingsId ? Number(savingsId) : undefined,
          clientRelationshipTypeId: relationshipId ? Number(relationshipId) : undefined,
          holdGuaranteeFunds: guarantee.holdGuaranteeFunds
        });
    if (ownSavingsIssue) {
      setError(ownSavingsIssue);
      return;
    }

    startTransition(async () => {
      const result = editing
        ? await updateLoanGuarantorAction(clientId, accountId, editing.id, {
            clientRelationshipTypeId: relationshipId || undefined,
            entityId: editingExternal ? undefined : editing.entityId,
            firstname: editingExternal ? firstname : undefined,
            lastname: editingExternal ? lastname : undefined,
            addressLine1: editingExternal ? addressLine1 : undefined,
            addressLine2: editingExternal ? addressLine2 : undefined,
            city: editingExternal ? city : undefined,
            state: editingExternal ? state : undefined,
            country: editingExternal ? country : undefined,
            zip: editingExternal ? zip : undefined,
            mobileNumber: editingExternal ? mobileNumber : undefined,
            housePhoneNumber: editingExternal ? housePhoneNumber : undefined,
            comment: editingExternal ? comment : undefined,
            dob: editingExternal ? dob : undefined
          })
        : await createLoanGuarantorAction(clientId, accountId, {
            guarantorTypeId: typeId,
            entityId: loanGuarantorTypeNeedsEntity(typeId) ? Number(entityId) : undefined,
            clientRelationshipTypeId: relationshipId || undefined,
            savingsId: savingsId ? Number(savingsId) : undefined,
            amount: amount || undefined,
            firstname: external ? firstname : undefined,
            lastname: external ? lastname : undefined,
            addressLine1: external ? addressLine1 : undefined,
            addressLine2: external ? addressLine2 : undefined,
            city: external ? city : undefined,
            state: external ? state : undefined,
            country: external ? country : undefined,
            zip: external ? zip : undefined,
            mobileNumber: external ? mobileNumber : undefined,
            housePhoneNumber: external ? housePhoneNumber : undefined,
            comment: external ? comment : undefined,
            dob: external ? dob : undefined
          });
      if (!toastCommandOutcome(result, editing ? UPDATE_TOAST : CREATE_TOAST)) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit guarantor' : 'Add guarantor'}
      description={
        editing
          ? 'Relationship can be changed. Personal details can be changed only for an external guarantor.'
          : 'Guarantee this loan with a customer, staff member, group, or an external person.'
      }
      formId={formId}
      submitLabel={editing ? 'Save guarantor' : 'Add guarantor'}
      submitLoading={pending}
      submitDisabled={loading}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <SelectField
          label="Guarantor type"
          required
          value={guarantorTypeId}
          onValueChange={(next) => {
            setGuarantorTypeId(next ?? '1');
            setEntityId('');
            setEntityLabel('');
            setSavingsId('');
            setAmount('');
          }}
          options={typeOptions}
          error={fieldErrors.guarantorTypeId}
          disabled={pending || loading || editing != null}
        />
        <SelectField
          label="Relationship"
          optional
          value={relationshipId || undefined}
          onValueChange={(next) => setRelationshipId(next ?? '')}
          options={relationshipOptions}
          placeholder="No relationship"
          error={fieldErrors.clientRelationshipTypeId}
          disabled={pending || loading}
        />
        {!editing && isCustomer ? (
          <CustomerSearchField
            id={`${formId}-customer`}
            selectedId={entityId ? Number(entityId) : undefined}
            selectedLabel={entityLabel}
            excludeClientId={guarantee.holdGuaranteeFunds ? undefined : borrowerClientId}
            error={fieldErrors.entityId}
            disabled={pending || loading}
            onSelect={(customer) => {
              setEntityId(customer ? String(customer.id) : '');
              setEntityLabel(customer?.label ?? '');
              setSavingsId('');
              setAmount('');
            }}
          />
        ) : null}
        {!editing && typeId === 2 ? (
          <SelectField
            label="Staff"
            required
            value={entityId || undefined}
            onValueChange={(next) => setEntityId(next ?? '')}
            options={staffSelectOptions}
            placeholder="Select a staff member"
            error={fieldErrors.entityId}
            disabled={pending || loading}
          />
        ) : null}
        {!editing && typeId === 4 ? (
          <SelectField
            label="Group"
            required
            value={entityId || undefined}
            onValueChange={(next) => setEntityId(next ?? '')}
            options={groupSelectOptions}
            placeholder="Select a group"
            error={fieldErrors.entityId}
            disabled={pending || loading}
          />
        ) : null}
        {(editing ? editingExternal : external) ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First name"
                required
                value={firstname}
                onChange={setFirstname}
                error={fieldErrors.firstname}
                disabled={pending || loading}
                maxLength={50}
              />
              <TextField
                label="Last name"
                required
                value={lastname}
                onChange={setLastname}
                error={fieldErrors.lastname}
                disabled={pending || loading}
                maxLength={50}
              />
            </div>
            <TextField
              label="Address line 1"
              optional
              value={addressLine1}
              onChange={setAddressLine1}
              error={fieldErrors.addressLine1}
              disabled={pending || loading}
              maxLength={500}
            />
            <TextField
              label="Address line 2"
              optional
              value={addressLine2}
              onChange={setAddressLine2}
              disabled={pending || loading}
              maxLength={500}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="City" optional value={city} onChange={setCity} disabled={pending || loading} maxLength={50} />
              <TextField label="State" optional value={state} onChange={setState} disabled={pending || loading} maxLength={50} />
              <TextField label="Country" optional value={country} onChange={setCountry} disabled={pending || loading} maxLength={50} />
              <TextField label="Postal code" optional value={zip} onChange={setZip} error={fieldErrors.zip} disabled={pending || loading} maxLength={20} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Mobile number"
                optional
                value={mobileNumber}
                onChange={setMobileNumber}
                error={fieldErrors.mobileNumber}
                disabled={pending || loading}
                maxLength={20}
              />
              <TextField
                label="House phone"
                optional
                value={housePhoneNumber}
                onChange={setHousePhoneNumber}
                error={fieldErrors.housePhoneNumber}
                disabled={pending || loading}
                maxLength={20}
              />
            </div>
            <DateField
              label="Date of birth"
              optional
              value={dob}
              onChange={(value) => setDob(value ?? '')}
              error={fieldErrors.dob}
              disabled={pending || loading}
            />
            <TextField
              label="Comment"
              optional
              multiline
              value={comment}
              onChange={setComment}
              disabled={pending || loading}
              maxLength={500}
            />
          </>
        ) : null}
        {!editing && guarantee.holdGuaranteeFunds && isCustomer && entityId ? (
          <>
            <SelectField
              label="Savings account"
              optional
              value={savingsId || undefined}
              onValueChange={(next) => setSavingsId(next ?? '')}
              options={savingsOptions}
              placeholder={savingsLoading ? 'Loading accounts…' : 'No savings pledge'}
              loading={savingsLoading}
              error={fieldErrors.savingsId}
              disabled={pending || loading}
              emptyMessage="No active savings accounts to pledge."
            />
            {savingsId ? (
              <NumericField
                label="Amount to pledge"
                required
                value={amount}
                onChange={setAmount}
                error={fieldErrors.amount}
                disabled={pending || loading}
              />
            ) : null}
          </>
        ) : null}
        {shortfall ? (
          <p className="text-sm text-muted-foreground">
            Guarantee cover on {formatAccountMoney(principal, currencyCode)} principal:{' '}
            own funds short {formatAccountMoney(shortfall.ownFundsShort, currencyCode)}, other
            guarantors short {formatAccountMoney(shortfall.otherShort, currencyCode)}, combined
            short {formatAccountMoney(shortfall.mandatoryShort, currencyCode)}. These percentages
            are checked when the loan is approved.
          </p>
        ) : null}
      </form>
    </FormSheet>
  );
}
