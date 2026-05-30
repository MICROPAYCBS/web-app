/**
 * A named Fineract backend the user can connect to.
 */
export interface FineractServerProfile {
  id: string;
  name: string;
  /** Full API base, e.g. https://host/fineract-provider/api/v1 */
  baseUrl: string;
  tenantId: string;
}

export interface ServerCatalog {
  servers: FineractServerProfile[];
  activeServerId: string | null;
}

export interface UpsertServerInput {
  name: string;
  baseUrl: string;
  tenantId: string;
}
