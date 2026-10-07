'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

type ProductDeleteResult =
  | { ok: true; pendingChecker?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function ProductDeleteButton({
  productName,
  productKindLabel,
  listHref,
  onDelete
}: {
  productName?: string;
  productKindLabel: string;
  listHref: string;
  onDelete: () => Promise<ProductDeleteResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const label = productName?.trim() || `this ${productKindLabel}`;

  function handleDelete() {
    setActionError(null);
    setPendingApproval(false);
    startTransition(async () => {
      const result = await onDelete();
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      if (result.pendingChecker) {
        setPendingApproval(true);
        router.refresh();
        return;
      }
      setOpen(false);
      router.push(listHref);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-destructive"
        disabled={pending}
        onClick={() => {
          setActionError(null);
          setPendingApproval(false);
          setOpen(true);
        }}
      >
        <Trash2 className="mr-1 size-4" />
        Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {productKindLabel}?</DialogTitle>
            <DialogDescription>
              This permanently removes {label}. A product that still has accounts cannot be
              deleted.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
          {pendingApproval ? (
            <p className="text-sm text-muted-foreground" role="status">
              This delete is waiting for approval.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || pendingApproval}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
