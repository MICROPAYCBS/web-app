'use client';

import type { ReactNode } from 'react';
import { useSession } from './session-context';
import type { PermissionInput, PermissionRule } from './types';
import { can } from './can';

export interface CanProps {
  permission: PermissionInput | PermissionRule;
  children: ReactNode;
  /** Rendered when denied (default: null). */
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { user, rbacEnabled } = useSession();

  if (!rbacEnabled) {
    return <>{children}</>;
  }

  if (can(user, permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
