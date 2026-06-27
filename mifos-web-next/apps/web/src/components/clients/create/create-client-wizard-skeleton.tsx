/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormWizardSkeleton } from '@/components/composites/form-wizard-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CREATE_CLIENT_WIZARD_SKELETON_STEPS } from './create-client-wizard-steps';

function BiodataFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

function BiodataFieldWithHintSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-3 w-full max-w-md" />
    </div>
  );
}

/**
 * Mirrors the default person biodata step grid (profile/class through external ID).
 */
function CreateClientBiodataStepSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldSkeleton />
        <BiodataFieldWithHintSkeleton className="sm:col-span-2" />
      </div>
    </div>
  );
}

export function CreateClientWizardSkeleton() {
  return (
    <FormWizardSkeleton
      title="Create customer"
      description="Complete each step to register a new customer."
      steps={CREATE_CLIENT_WIZARD_SKELETON_STEPS}
      activeStepIndex={0}
      content={<CreateClientBiodataStepSkeleton />}
    />
  );
}
