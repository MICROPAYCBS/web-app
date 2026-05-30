'use client';

import { SessionProvider as AuthSessionProvider, type SessionUser } from '@mifos/auth';
import type { ReactNode } from 'react';

export function SessionProvider({
  children,
  user,
  rbacEnabled
}: {
  children: ReactNode;
  user: SessionUser | null;
  rbacEnabled: boolean;
}) {
  return (
    <AuthSessionProvider user={user} rbacEnabled={rbacEnabled}>
      {children}
    </AuthSessionProvider>
  );
}
