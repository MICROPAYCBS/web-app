'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  EMPTY_BUSINESS_DATE_CONTEXT,
  hasConfiguredBusinessDate,
  resolveTransactionDate,
  type BusinessDateContextValue
} from '@/lib/fineract/business-date-context';
import { dateToFineract } from '@/lib/fineract/date-input';

const BusinessDateContext = createContext<BusinessDateContextValue>(EMPTY_BUSINESS_DATE_CONTEXT);

export function BusinessDateProvider({
  value,
  children
}: {
  value: BusinessDateContextValue;
  children: ReactNode;
}) {
  return <BusinessDateContext.Provider value={value}>{children}</BusinessDateContext.Provider>;
}

export function useBusinessDate(): BusinessDateContextValue {
  return useContext(BusinessDateContext);
}

/** Default Fineract date string for a new transaction or posting. */
export function useInitialTransactionDate(): string {
  const businessDate = useBusinessDate();
  const today = useMemo(() => dateToFineract(new Date()) ?? '', []);
  return useMemo(
    () => resolveTransactionDate(businessDate, today),
    [businessDate, today]
  );
}

/** True when transaction dates default to and are capped at the organisation business date. */
export function useTransactionDateBoundedByBusinessDate(): boolean {
  return hasConfiguredBusinessDate(useBusinessDate());
}

/** @deprecated Use {@link useTransactionDateBoundedByBusinessDate}. Dates are not read-only. */
export function useTransactionDateLocked(): boolean {
  return useTransactionDateBoundedByBusinessDate();
}
