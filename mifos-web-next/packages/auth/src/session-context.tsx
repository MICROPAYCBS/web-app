'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SessionUser } from './types';
import { can } from './can';
import type { PermissionInput, PermissionRule } from './types';

export interface SessionContextValue {
  user: SessionUser | null;
  rbacEnabled: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  rbacEnabled: true
});

export function SessionProvider({
  children,
  user,
  rbacEnabled = true
}: {
  children: ReactNode;
  user: SessionUser | null;
  rbacEnabled?: boolean;
}) {
  const value = useMemo(() => ({ user, rbacEnabled }), [user, rbacEnabled]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

export function useCan(permission: PermissionInput | PermissionRule): boolean {
  const { user, rbacEnabled } = useSession();
  if (!rbacEnabled) {
    return true;
  }
  return can(user, permission);
}
