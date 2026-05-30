import { APP_ROUTES } from './app-routes';
import type { ParityStatus, RouteDefinition } from './types';

export interface ParityRow {
  id: string;
  path: string;
  domain: string;
  label: string;
  kind: string;
  status: ParityStatus;
  webAppRef?: string;
  fineractApi?: string;
  schemaId?: string;
  notes?: string;
}

export function buildParityMatrix(): ParityRow[] {
  return (Object.values(APP_ROUTES) as RouteDefinition[]).map((r) => ({
    id: r.id,
    path: r.path,
    domain: r.domain,
    label: r.label,
    kind: r.kind,
    status: r.parity.status,
    webAppRef: r.parity.webAppRef,
    fineractApi: r.parity.fineractApi,
    schemaId: r.parity.schemaId,
    notes: r.parity.notes
  }));
}

export function parityByDomain(): Record<string, ParityRow[]> {
  const rows = buildParityMatrix();
  return rows.reduce(
    (acc, row) => {
      if (!acc[row.domain]) {
        acc[row.domain] = [];
      }
      acc[row.domain].push(row);
      return acc;
    },
    {} as Record<string, ParityRow[]>
  );
}

export function paritySummary(): Record<ParityStatus, number> {
  const summary: Record<ParityStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
    'n/a': 0
  };
  for (const row of buildParityMatrix()) {
    summary[row.status] += 1;
  }
  return summary;
}
