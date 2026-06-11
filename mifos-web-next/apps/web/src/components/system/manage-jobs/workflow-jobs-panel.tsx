'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractWorkflowJobStep } from '@mifos/api-client';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  fetchAvailableWorkflowStepsAction,
  fetchWorkflowJobStepsAction,
  updateWorkflowJobStepsAction
} from '@/actions/jobs';
import { WorkflowStepsFlow } from '@/components/system/manage-jobs/workflow-steps-flow';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function WorkflowJobsPanel({
  jobNames,
  canUpdate
}: {
  jobNames: string[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState(jobNames[0] ?? '');
  const [steps, setSteps] = useState<FineractWorkflowJobStep[]>([]);
  const [baseSteps, setBaseSteps] = useState<FineractWorkflowJobStep[]>([]);
  const [dirty, setDirty] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [availableSteps, setAvailableSteps] = useState<
    Array<{ stepName: string; stepDescription?: string }>
  >([]);
  const [stepToAdd, setStepToAdd] = useState('');
  const [pending, startTransition] = useTransition();
  const [loadingSteps, startLoadTransition] = useTransition();

  useEffect(() => {
    if (!selectedJob) {
      setSteps([]);
      setBaseSteps([]);
      setDirty(false);
      return;
    }
    startLoadTransition(async () => {
      const result = await fetchWorkflowJobStepsAction(selectedJob);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSteps(result.steps);
      setBaseSteps(result.steps);
      setDirty(false);
    });
  }, [selectedJob]);

  function moveStep(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= steps.length) {
      return;
    }
    const next = [...steps];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setSteps(next);
    setDirty(true);
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index));
    setDirty(true);
  }

  function openAddStep() {
    if (!selectedJob) {
      return;
    }
    startTransition(async () => {
      const result = await fetchAvailableWorkflowStepsAction(selectedJob);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const existing = new Set(steps.map((step) => step.stepName));
      const filtered = result.steps.filter((step) => !existing.has(step.stepName));
      if (!filtered.length) {
        toast.message('No additional steps are available for this workflow.');
        return;
      }
      setAvailableSteps(filtered);
      setStepToAdd(filtered[0]?.stepName ?? '');
      setAddOpen(true);
    });
  }

  function handleAddStep() {
    const step = availableSteps.find((item) => item.stepName === stepToAdd);
    if (!step) {
      return;
    }
    setSteps((current) => [
      ...current,
      {
        stepName: step.stepName,
        stepDescription: step.stepDescription,
        order: current.length + 1
      }
    ]);
    setDirty(true);
    setAddOpen(false);
  }

  function handleSave() {
    if (!selectedJob) {
      return;
    }
    startTransition(async () => {
      const result = await updateWorkflowJobStepsAction(selectedJob, steps);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Workflow steps saved.');
      setBaseSteps(steps);
      setDirty(false);
      router.refresh();
    });
  }

  function handleCancel() {
    setSteps(baseSteps);
    setDirty(false);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose a business workflow job and configure the ordered steps that run during batch
        processing. Reorder, add, or remove steps, then apply changes.
      </p>
      <div className="max-w-md space-y-2">
        <Label htmlFor="workflow-job">Workflow job</Label>
        <Select
          value={selectedJob}
          onValueChange={(value) => value && setSelectedJob(value)}
        >
          <SelectTrigger id="workflow-job">
            <SelectValue placeholder="Select a workflow job" />
          </SelectTrigger>
          <SelectContent>
            {jobNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!dirty && steps.length > 0 ? <WorkflowStepsFlow steps={steps} /> : null}

      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>Step</span>
          <span className="text-center">Order</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>
        {loadingSteps ? (
          <p className="p-4 text-sm text-muted-foreground">Loading workflow steps…</p>
        ) : steps.length ? (
          steps.map((step, index) => (
            <div
              key={`${step.stepName}-${index}`}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium">{step.stepName}</p>
                {step.stepDescription ? (
                  <p className="text-xs text-muted-foreground">{step.stepDescription}</p>
                ) : null}
              </div>
              <span className="text-center text-sm text-muted-foreground">{index + 1}</span>
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canUpdate || index === 0}
                  onClick={() => moveStep(index, -1)}
                  aria-label="Move step up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canUpdate || index === steps.length - 1}
                  onClick={() => moveStep(index, 1)}
                  aria-label="Move step down"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canUpdate}
                  onClick={() => removeStep(index)}
                  aria-label="Remove step"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">No workflow steps configured.</p>
        )}
      </div>

      {canUpdate ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={openAddStep} disabled={!selectedJob || pending}>
            <Plus className="mr-2 size-4" />
            Link job step
          </Button>
          <Button type="button" onClick={handleSave} disabled={!dirty || pending}>
            Apply changes
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={!dirty || pending}>
            Cancel
          </Button>
        </div>
      ) : null}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add job step</DialogTitle>
            <DialogDescription>Select a step to append to this workflow.</DialogDescription>
          </DialogHeader>
          <Select value={stepToAdd} onValueChange={(value) => value && setStepToAdd(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a step" />
            </SelectTrigger>
            <SelectContent>
              {availableSteps.map((step) => (
                <SelectItem key={step.stepName} value={step.stepName}>
                  {step.stepDescription ?? step.stepName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddStep}>
              Add step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
