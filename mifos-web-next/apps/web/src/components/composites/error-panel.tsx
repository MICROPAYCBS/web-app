'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlertTriangle, Check, Copy, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getErrorPanelPresentation } from '@/lib/errors/format-error-details';
import { cn } from '@/lib/utils';

export interface ErrorPanelProps {
  error: unknown;
  title?: string;
  description?: string;
  digest?: string;
  componentStack?: string;
  onReset?: () => void;
  resetLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  variant?: 'page' | 'inline';
  className?: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
}

export function ErrorPanel({
  error,
  title,
  description,
  digest,
  componentStack,
  onReset,
  resetLabel = 'Try again',
  homeHref = '/',
  homeLabel = 'Back to dashboard',
  variant = 'page',
  className
}: ErrorPanelProps) {
  const [copied, setCopied] = useState(false);
  const presentation = useMemo(
    () => getErrorPanelPresentation(error, { digest, componentStack, title, description }),
    [error, digest, componentStack, title, description]
  );

  async function handleCopy() {
    const ok = await copyText(presentation.supportDetails);
    if (ok) {
      setCopied(true);
      toast.success(
        presentation.showTechnicalDetails
          ? 'Error details copied to clipboard.'
          : 'Reference copied to clipboard.'
      );
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    toast.error('Could not copy to clipboard.');
  }

  const isPage = variant === 'page';

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center p-4 md:p-6',
        isPage ? 'min-h-[50vh]' : 'min-h-0 flex-1',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full max-w-lg border-border">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <AlertTriangle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-2">
              <CardTitle>{presentation.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {presentation.description}
              </CardDescription>
              {presentation.summary ? (
                <p className="text-sm font-medium text-foreground">{presentation.summary}</p>
              ) : null}
            </div>
          </div>
        </CardHeader>

        {presentation.showTechnicalDetails ? (
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Error details
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="size-4" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden />
                    Copy details
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {presentation.supportDetails}
            </pre>
          </CardContent>
        ) : presentation.referenceId ? (
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Reference{' '}
                <span className="font-mono text-foreground tabular-nums">
                  {presentation.referenceId}
                </span>
              </p>
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="size-4" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden />
                    Copy reference
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        ) : null}

        <CardFooter className="flex flex-wrap justify-end gap-2">
          {onReset ? (
            <Button type="button" variant="outline" onClick={onReset}>
              <RotateCcw className="size-4" aria-hidden />
              {resetLabel}
            </Button>
          ) : null}
          {homeHref ? (
            <Link href={homeHref} className={cn(buttonVariants())}>
              {homeLabel}
            </Link>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}
