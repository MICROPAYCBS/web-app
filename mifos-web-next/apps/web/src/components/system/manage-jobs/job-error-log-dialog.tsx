'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJobRunHistory } from '@mifos/api-client';
import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  formatJobDateTime,
  formatJobRunDuration,
  formatJobRunLogContent,
  formatJobRunStatusLabel,
  jobRunSucceeded
} from '@/lib/fineract/jobs-display';

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

function buildCopyableRunLog({
  jobName,
  history,
  logText,
  message
}: {
  jobName?: string;
  history?: FineractSchedulerJobRunHistory;
  logText: string;
  message?: string;
}): string {
  const lines: string[] = [];
  if (jobName) {
    lines.push(`Job: ${jobName}`);
  }
  if (history?.status) {
    lines.push(`Status: ${history.status}`);
  }
  if (history?.triggerType) {
    lines.push(`Trigger: ${history.triggerType}`);
  }
  if (history?.version != null) {
    lines.push(`Version: ${history.version}`);
  }
  lines.push(`Started: ${formatJobDateTime(history?.jobRunStartTime)}`);
  lines.push(`Ended: ${formatJobDateTime(history?.jobRunEndTime)}`);
  lines.push(`Duration: ${formatJobRunDuration(history)}`);
  if (message) {
    lines.push('', 'Message:', message);
  }
  lines.push('', 'Log:', logText);
  return lines.join('\n');
}

export function JobErrorLogDialog({
  open,
  onOpenChange,
  jobName,
  history
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobName?: string;
  history?: FineractSchedulerJobRunHistory;
}) {
  const [copied, setCopied] = useState(false);
  const succeeded = jobRunSucceeded(history);
  const message = history?.jobRunErrorMessage?.trim();
  const log = history?.jobRunErrorLog?.trim();
  const showSeparateMessage = Boolean(message && log && message !== log && !log.includes(message));
  const logBody = formatJobRunLogContent(history);
  const displayedLog = showSeparateMessage ? log || 'No additional log output.' : logBody;
  const copyableText = useMemo(
    () =>
      buildCopyableRunLog({
        jobName,
        history,
        logText: displayedLog,
        message: showSeparateMessage ? message : undefined
      }),
    [displayedLog, history, jobName, message, showSeparateMessage]
  );

  async function handleCopy() {
    const ok = await copyText(copyableText);
    if (ok) {
      setCopied(true);
      toast.success('Run log copied to clipboard.');
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    toast.error('Could not copy to clipboard.');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{jobName ? `Run log — ${jobName}` : 'Job run log'}</DialogTitle>
          <DialogDescription>
            {history?.jobRunStartTime
              ? `Last recorded run started ${formatJobDateTime(history.jobRunStartTime)}`
              : 'Last run details'}
          </DialogDescription>
        </DialogHeader>

        <DetailFieldGrid columns={2}>
          <DetailField label="Status">
            {history?.status ? (
              <Badge variant={succeeded ? 'default' : 'destructive'}>
                {formatJobRunStatusLabel(history.status)}
              </Badge>
            ) : (
              '—'
            )}
          </DetailField>
          <DetailField label="Trigger">{history?.triggerType ?? '—'}</DetailField>
          <DetailField label="Version">
            {history?.version != null ? String(history.version) : '—'}
          </DetailField>
          <DetailField label="Duration">{formatJobRunDuration(history)}</DetailField>
          <DetailField label="Started">{formatJobDateTime(history?.jobRunStartTime)}</DetailField>
          <DetailField label="Ended">{formatJobDateTime(history?.jobRunEndTime)}</DetailField>
        </DetailFieldGrid>

        {showSeparateMessage ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Message</p>
            <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
              {message}
            </pre>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{succeeded ? 'Run log' : 'Error log'}</p>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="mr-2 size-4" aria-hidden />
              ) : (
                <Copy className="mr-2 size-4" aria-hidden />
              )}
              {copied ? 'Copied' : 'Copy to clipboard'}
            </Button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap break-all">
            {displayedLog}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
