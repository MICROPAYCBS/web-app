import type { RouteDefinition } from './types';

/**
 * Canonical route registry — single source of truth.
 * Extend when adding pages; derive nav, RBAC, and parity from here.
 */
export const APP_ROUTES = {
  dashboard: {
    id: 'dashboard',
    path: '/',
    kind: 'page',
    label: 'Dashboard',
    domain: 'platform',
    nav: true,
    navOrder: 10,
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', webAppRef: 'home/dashboard' }
  },
  connect: {
    id: 'connect',
    path: '/connect',
    kind: 'page',
    label: 'Connect',
    domain: 'auth',
    public: true,
    requiresServer: false,
    requiresAuth: false,
    parity: { status: 'done', notes: 'Greenfield server selection' }
  },
  login: {
    id: 'login',
    path: '/login',
    kind: 'page',
    label: 'Sign in',
    domain: 'auth',
    public: true,
    requiresServer: true,
    requiresAuth: false,
    parity: { status: 'in_progress', webAppRef: 'login' }
  },
  forbidden: {
    id: 'forbidden',
    path: '/forbidden',
    kind: 'page',
    label: 'Access denied',
    domain: 'platform',
    public: true,
    requiresServer: true,
    requiresAuth: false,
    parity: { status: 'done' }
  },
  callback: {
    id: 'callback',
    path: '/callback',
    kind: 'page',
    label: 'OAuth callback',
    domain: 'auth',
    public: true,
    requiresServer: true,
    requiresAuth: false,
    parity: { status: 'todo', webAppRef: 'zitadel/callback' }
  },
  clients: {
    id: 'clients',
    path: '/clients',
    kind: 'page',
    label: 'Clients',
    domain: 'clients',
    nav: true,
    navOrder: 20,
    permissionKey: 'clients.list',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'in_progress',
      webAppRef: 'clients',
      fineractApi: 'GET /clients',
      schemaId: 'clients.create'
    }
  },
  clientsApi: {
    id: 'clientsApi',
    path: '/api/clients',
    kind: 'api',
    label: 'Clients API (BFF)',
    domain: 'clients',
    permissionKey: 'clients.list',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', fineractApi: 'GET /clients' }
  },
  checkerInbox: {
    id: 'checkerInbox',
    path: '/checker-inbox-and-tasks',
    kind: 'page',
    label: 'Checker inbox',
    domain: 'tasks',
    nav: true,
    navOrder: 30,
    permissionKey: 'checkerInbox',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'todo', webAppRef: 'tasks/checker-inbox-and-tasks' }
  },
  settingsServers: {
    id: 'settingsServers',
    path: '/settings/servers',
    kind: 'page',
    label: 'Server settings',
    domain: 'settings',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'done', notes: 'Greenfield multi-server' }
  }
} as const satisfies Record<string, RouteDefinition>;

export type AppRouteId = keyof typeof APP_ROUTES;

export type AppRoutePath = (typeof APP_ROUTES)[AppRouteId]['path'];
