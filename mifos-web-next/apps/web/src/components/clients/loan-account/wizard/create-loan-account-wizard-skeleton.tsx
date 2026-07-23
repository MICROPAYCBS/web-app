/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { FormWizardSkeleton } from '@/components/composites/form-wizard-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CREATE_LOAN_ACCOUNT_WIZARD_SKELETON_STEPS } from './create-loan-account-wizard-steps';

function FieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

function SectionSkeleton({
  titleClassName,
  children
}: {
  titleClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Skeleton className={cn('h-5 w-36', titleClassName)} />
      {children}
    </div>
  );
}

/** Mirrors the Product (core) step: product, assignment/funding, reference. */
function CreateLoanAccountProductStepSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-full max-w-lg" />
      <SectionSkeleton titleClassName="w-28">
        <FieldSkeleton />
      </SectionSkeleton>
      <SectionSkeleton titleClassName="w-44">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </SectionSkeleton>
      <SectionSkeleton titleClassName="w-24">
        <FieldSkeleton />
      </SectionSkeleton>
    </div>
  );
}

export function CreateLoanAccountWizardSkeleton({
  mode = 'create'
}: {
  mode?: 'create' | 'edit';
}) {
  const isEdit = mode === 'edit';

  return (
    <FormWizardSkeleton
      title={isEdit ? 'Modify application' : 'Apply for loan'}
      description={
        isEdit
          ? 'Update this pending loan application.'
          : 'Complete each step to submit a loan application for this customer.'
      }
      steps={CREATE_LOAN_ACCOUNT_WIZARD_SKELETON_STEPS}
      activeStepIndex={0}
      content={<CreateLoanAccountProductStepSkeleton />}
    />
  );
}
