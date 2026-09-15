'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function WizardLeaveConfirmDialog({
  open,
  onOpenChange,
  onConfirmLeave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave without finishing?</DialogTitle>
          <DialogDescription>
            Your answers stay in this browser tab until you close it. You can come back and resume
            this form.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Stay
          </Button>
          <Button type="button" onClick={onConfirmLeave}>
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
