'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { ContextHelpPanel } from '@/components/composites/context-help/context-help-panel';
import { ContextHelpProvider } from '@/components/composites/context-help/context-help-provider';
import { ContextHelpTrigger } from '@/components/composites/context-help/context-help-trigger';
import type { ContextHelpContent } from '@/lib/context-help/types';
import { cn } from '@/lib/utils';

/**
 * Wraps a screen with self-documentation: help trigger + full-height sheet sidebar.
 * Pass {@link content} keyed by screen; use {@link ContextHelpFieldHint} on fields.
 */
export function ContextHelpShell({
  content,
  children,
  className
}: {
  content: ContextHelpContent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ContextHelpProvider content={content}>
      <div className={cn('relative min-h-0 flex-1', className)}>{children}</div>
      <ContextHelpPanel />
      <ContextHelpTrigger />
    </ContextHelpProvider>
  );
}
