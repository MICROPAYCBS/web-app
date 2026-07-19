'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlertTriangle, Check, Copy, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { copyText } from '@/lib/clipboard';
import { splitFineractErrorMessage } from '@/lib/fineract-error-message';
import { cn } from '@/lib/utils';

/**
 * Inline Fineract error presentation — same copy affordance as {@link toastFineractError}.
 * Used for load failures and recoverable route errors; not for unknown runtime crashes.
 */
export function FineractErrorAlert({
  message,
  title,
  hint,
  onRetry,
  retryLabel = 'Try again',
  className
}: {
  message: string;
  title?: string;
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = message.trim();
  const split = splitFineractErrorMessage(text);
  const heading = title ?? split.title;
  const body = title ? text : split.description;

  async function handleCopy() {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast.success('Copied to clipboard.');
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    toast.error('Could not copy to clipboard.');
  }

  return (
    <div
      className={cn(
        'rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">{heading}</p>
          {body ? <p className="text-sm whitespace-pre-wrap text-destructive/90">{body}</p> : null}
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 size-4" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" aria-hidden />
                  Copy
                </>
              )}
            </Button>
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="mr-2 size-4" aria-hidden />
                {retryLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
