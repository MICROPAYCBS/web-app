import { ADMIN_NAV_ROUTES } from './admin-nav-routes';
import type { RouteDefinition } from './types';

/**
 * Canonical route registry — single source of truth.
 * Nav: featured row + collapsible groups + Quick Find (see derive-nav.ts).
 */
const CORE_APP_ROUTES = {
  dashboard: {
    id: 'dashboard',
    path: '/',
    kind: 'page',
    label: 'Dashboard',
    domain: 'platform',
    nav: true,
    navOrder: 10,
    navGroup: 'overview',
    navIcon: 'layout-dashboard',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', webAppRef: 'home/dashboard' }
  },
  search: {
    id: 'search',
    path: '/search',
    kind: 'page',
    label: 'Search',
    domain: 'platform',
    quickFind: false,
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', webAppRef: 'search', fineractApi: 'GET /search' }
  },
  searchApi: {
    id: 'searchApi',
    path: '/api/search',
    kind: 'api',
    label: 'Search API (BFF)',
    domain: 'platform',
    quickFind: false,
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', fineractApi: 'GET /search' }
  },
  connect: {
    id: 'connect',
    path: '/connect',
    kind: 'page',
    label: 'Connect',
    domain: 'auth',
    public: true,
    quickFind: false,
    requiresServer: false,
    requiresAuth: false,
    parity: { status: 'done', notes: 'Redirects to /login?servers=1' }
  },
  login: {
    id: 'login',
    path: '/login',
    kind: 'page',
    label: 'Sign in',
    domain: 'auth',
    public: true,
    quickFind: false,
    requiresServer: false,
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
    quickFind: false,
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
    quickFind: false,
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
    navOrder: 10,
    navGroup: 'portfolio',
    navFeatured: true,
    navFeaturedOrder: 10,
    navIcon: 'users',
    keywords: ['customer', 'borrower', 'member'],
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
  groups: {
    id: 'groups',
    path: '/groups',
    kind: 'page',
    label: 'Groups',
    domain: 'groups',
    nav: true,
    navOrder: 20,
    navGroup: 'portfolio',
    navIcon: 'users-round',
    keywords: ['group lending'],
    permissionKey: 'clients.list',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', webAppRef: 'groups' }
  },
  centers: {
    id: 'centers',
    path: '/centers',
    kind: 'page',
    label: 'Centers',
    domain: 'centers',
    nav: true,
    navOrder: 30,
    navGroup: 'portfolio',
    navIcon: 'building-2',
    permissionKey: 'clients.list',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'done', webAppRef: 'centers' }
  },
  loans: {
    id: 'loans',
    path: '/loans',
    kind: 'page',
    label: 'Loans',
    domain: 'loans',
    nav: true,
    navOrder: 40,
    navGroup: 'portfolio',
    navFeatured: true,
    navFeaturedOrder: 20,
    navIcon: 'landmark',
    keywords: ['loan account', 'credit', 'lending'],
    permissionKey: 'loans.list',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', webAppRef: 'loans', fineractApi: 'GET /loans' }
  },
  savings: {
    id: 'savings',
    path: '/savings',
    kind: 'page',
    label: 'Savings accounts',
    domain: 'savings',
    nav: true,
    navOrder: 50,
    navGroup: 'portfolio',
    navFeatured: true,
    navFeaturedOrder: 30,
    navIcon: 'piggy-bank',
    keywords: ['deposit', 'savings account', 'wallet'],
    permissionKey: 'savings.list',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', webAppRef: 'savings', fineractApi: 'GET /savingsaccounts' }
  },
  loanProducts: {
    id: 'loanProducts',
    path: '/products/loan-products',
    kind: 'page',
    label: 'Loan products',
    domain: 'products',
    nav: true,
    navOrder: 10,
    navGroup: 'products',
    navIcon: 'book-open',
    keywords: ['product', 'loan product'],
    permissionKey: 'products.loan',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'in_progress',
      webAppRef: 'products/loan-products',
      fineractApi: 'GET /loanproducts'
    }
  },
  savingsProducts: {
    id: 'savingsProducts',
    path: '/products/savings-products',
    kind: 'page',
    label: 'Savings products',
    domain: 'products',
    nav: true,
    navOrder: 20,
    navGroup: 'products',
    navIcon: 'wallet',
    keywords: ['product', 'savings product'],
    permissionKey: 'products.savings',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'in_progress',
      webAppRef: 'products/saving-products',
      fineractApi: 'GET /savingsproducts'
    }
  },
  shareProducts: {
    id: 'shareProducts',
    path: '/products/share-products',
    kind: 'page',
    label: 'Share products',
    domain: 'products',
    nav: true,
    navOrder: 30,
    navGroup: 'products',
    navIcon: 'pie-chart',
    keywords: ['product', 'share product'],
    permissionKey: 'products.share',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'in_progress',
      webAppRef: 'products/share-products',
      fineractApi: 'GET /products/share'
    }
  },
  recurringDepositProducts: {
    id: 'recurringDepositProducts',
    path: '/products/recurring-deposit-products',
    kind: 'page',
    label: 'Recurring deposit products',
    domain: 'products',
    nav: true,
    navOrder: 80,
    navGroup: 'products',
    navIcon: 'refresh-cw',
    keywords: ['product', 'recurring deposit', 'rd'],
    permissionKey: 'products.recurringDeposit',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'done',
      webAppRef: 'products/recurring-deposit-products',
      fineractApi: 'GET /recurringdepositproducts'
    }
  },
  fixedDepositProducts: {
    id: 'fixedDepositProducts',
    path: '/products/fixed-deposit-products',
    kind: 'page',
    label: 'Fixed deposit products',
    domain: 'products',
    nav: true,
    navOrder: 90,
    navGroup: 'products',
    navIcon: 'lock',
    keywords: ['product', 'fixed deposit', 'fd'],
    permissionKey: 'products.fixedDeposit',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'done',
      webAppRef: 'products/fixed-deposit-products',
      fineractApi: 'GET /fixeddepositproducts'
    }
  },
  chargeProducts: {
    id: 'chargeProducts',
    path: '/products/charges',
    kind: 'page',
    label: 'Charges',
    domain: 'products',
    nav: true,
    navOrder: 40,
    navGroup: 'products',
    navIcon: 'percent',
    keywords: ['fee', 'charge', 'penalty'],
    permissionKey: 'products.charges',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'done',
      webAppRef: 'products/charges',
      fineractApi: 'GET /charges'
    }
  },
  collateralProducts: {
    id: 'collateralProducts',
    path: '/products/collaterals',
    kind: 'page',
    label: 'Collateral products',
    domain: 'products',
    nav: true,
    navOrder: 110,
    navGroup: 'products',
    navIcon: 'shield-check',
    keywords: ['collateral', 'collateral product'],
    permissionKey: 'products.collaterals',
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'done',
      webAppRef: 'products/collaterals',
      fineractApi: 'GET /collateral-management'
    }
  },
  accounting: {
    id: 'accounting',
    path: '/accounting',
    kind: 'page',
    label: 'Accounting',
    domain: 'accounting',
    nav: false,
    navOrder: 10,
    navGroup: 'accounting',
    navIcon: 'calculator',
    keywords: ['gl', 'journal', 'ledger', 'coa'],
    permissionKey: 'accounting',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'todo', webAppRef: 'accounting' }
  },
  organization: {
    id: 'organization',
    path: '/organization',
    kind: 'page',
    label: 'Organization',
    domain: 'organization',
    nav: false,
    navOrder: 10,
    navGroup: 'organization',
    navIcon: 'building',
    keywords: ['office', 'staff', 'hierarchy', 'branch'],
    permissionKey: 'organization',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'todo', webAppRef: 'organization' }
  },
  checkerInbox: {
    id: 'checkerInbox',
    path: '/checker-inbox-and-tasks',
    kind: 'page',
    label: 'Checker inbox',
    domain: 'tasks',
    nav: true,
    navOrder: 20,
    navGroup: 'overview',
    navIcon: 'inbox',
    keywords: ['maker checker', 'tasks', 'approval'],
    permissionKey: 'checkerInbox',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'done', webAppRef: 'tasks/checker-inbox-and-tasks' }
  },
  settingsServers: {
    id: 'settingsServers',
    path: '/settings/servers',
    kind: 'page',
    label: 'Server settings',
    domain: 'settings',
    nav: true,
    navOrder: 10,
    navGroup: 'administration',
    navIcon: 'settings',
    keywords: ['fineract', 'connection', 'tenant'],
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'done', notes: 'Greenfield multi-server' }
  },
  clientsApi: {
    id: 'clientsApi',
    path: '/api/clients',
    kind: 'api',
    label: 'Clients API (BFF)',
    domain: 'clients',
    quickFind: false,
    permissionKey: 'clients.list',
    requiresServer: true,
    requiresAuth: true,
    parity: { status: 'in_progress', fineractApi: 'GET /clients' }
  }
} as const satisfies Record<string, RouteDefinition>;

/** Canonical route registry (core + admin/config list screens). */
export const APP_ROUTES = {
  ...CORE_APP_ROUTES,
  ...ADMIN_NAV_ROUTES
} as const satisfies Record<string, RouteDefinition>;

export type AppRouteId = keyof typeof APP_ROUTES;

export type AppRoutePath = (typeof APP_ROUTES)[AppRouteId]['path'];
