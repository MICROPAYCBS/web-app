import Link from 'next/link';
import type { ComponentProps } from 'react';
import { routePath, type AppRouteId } from '@mifos/routes';

type LinkProps = ComponentProps<typeof Link>;

export type AppLinkProps =
  | (Omit<LinkProps, 'href'> & { route: AppRouteId; href?: never })
  | (LinkProps & { route?: never });

/**
 * Type-safe Link using the central route registry (`route` prop),
 * or pass `href` for dynamic paths (e.g. `/clients/123`).
 */
export function AppLink({ route, href, ...props }: AppLinkProps) {
  const resolved = route !== undefined ? routePath(route) : href;
  if (!resolved) {
    throw new Error('AppLink requires `route` or `href`');
  }
  return <Link href={resolved} {...props} />;
}
