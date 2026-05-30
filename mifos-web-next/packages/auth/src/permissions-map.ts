import manifest from '../permissions.manifest.json';
import type { PermissionRule } from './types';

export type PermissionKey = keyof typeof manifest;

const map = manifest as Record<string, PermissionRule>;

export function resolvePermission(key: PermissionKey): PermissionRule {
  return map[key];
}
