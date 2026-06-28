'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail, FineractAuditTrailListItem } from '@mifos/api-client';
import { resolvePermission, useCan } from '@mifos/auth';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { getAuditTrailAction } from '@/actions/audit-trails';
import { AuditTrailDetailSheet } from '@/components/audit/audit-trail-detail-sheet';
import { cn } from '@/lib/utils';

export type AuditTrailOpenInput = number | FineractAuditTrailListItem;

type AuditTrailPanelContextValue = {
  canView: boolean;
  openAuditTrail: (input: AuditTrailOpenInput) => void;
  closeAuditTrail: () => void;
};

const AuditTrailPanelContext = createContext<AuditTrailPanelContextValue | null>(null);

function auditHasCommandPayload(audit: FineractAuditTrailListItem): audit is FineractAuditTrailDetail {
  return typeof audit.commandAsJson === 'string';
}

function resolveAuditId(input: AuditTrailOpenInput): number {
  return typeof input === 'number' ? input : input.id;
}

export function AuditTrailPanelProvider({ children }: { children: ReactNode }) {
  const canView = useCan(resolvePermission('system.audit'));
  const [open, setOpen] = useState(false);
  const [audit, setAudit] = useState<FineractAuditTrailDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeAuditTrail = useCallback(() => {
    setOpen(false);
  }, []);

  const openAuditTrail = useCallback(
    (input: AuditTrailOpenInput) => {
      if (!canView) {
        return;
      }

      setOpen(true);
      setError(null);

      if (typeof input !== 'number' && auditHasCommandPayload(input)) {
        setAudit(input);
        setLoading(false);
        return;
      }

      const auditId = resolveAuditId(input);
      setAudit(null);
      setLoading(true);

      void getAuditTrailAction(auditId).then((result) => {
        setLoading(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setAudit(result.audit);
      });
    },
    [canView]
  );

  const value = useMemo(
    () => ({
      canView,
      openAuditTrail,
      closeAuditTrail
    }),
    [canView, openAuditTrail, closeAuditTrail]
  );

  return (
    <AuditTrailPanelContext.Provider value={value}>
      {children}
      {canView ? (
        <AuditTrailDetailSheet
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setAudit(null);
              setError(null);
              setLoading(false);
            }
          }}
          audit={audit}
          loading={loading}
          error={error}
        />
      ) : null}
    </AuditTrailPanelContext.Provider>
  );
}

export function useAuditTrailPanel(): AuditTrailPanelContextValue {
  const context = useContext(AuditTrailPanelContext);
  if (!context) {
    throw new Error('useAuditTrailPanel must be used within AuditTrailPanelProvider');
  }
  return context;
}

export function useOptionalAuditTrailPanel(): AuditTrailPanelContextValue | null {
  return useContext(AuditTrailPanelContext);
}

export function AuditTrailOpenButton({
  audit,
  children,
  className
}: {
  audit: AuditTrailOpenInput;
  children?: ReactNode;
  className?: string;
}) {
  const panel = useAuditTrailPanel();
  const label = children ?? (typeof audit === 'number' ? audit : audit.id);

  if (!panel.canView) {
    return <span className={cn('tabular-nums', className)}>{label}</span>;
  }

  return (
    <button
      type="button"
      className={cn(
        'tabular-nums text-primary underline-offset-4 hover:underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      onClick={() => panel.openAuditTrail(audit)}
    >
      {label}
    </button>
  );
}
