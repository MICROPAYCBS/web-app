import { resolveFineractApiBaseUrl } from './normalize';

const DEMO_HOST = 'demo.mifos.community';
const SANDBOX_HOST = 'sandbox.mifos.community';

/** Hostname for display (after URL normalization). */
export function getFineractApiHost(baseUrl: string): string {
  try {
    return new URL(resolveFineractApiBaseUrl(baseUrl)).host;
  } catch {
    return baseUrl;
  }
}

export function isDeprecatedDemoFineractHost(baseUrl: string): boolean {
  return getFineractApiHost(baseUrl) === DEMO_HOST;
}

export function deprecatedDemoFineractHint(): string {
  return `${DEMO_HOST} no longer accepts the standard mifos/password credentials. Use https://${SANDBOX_HOST} instead.`;
}
