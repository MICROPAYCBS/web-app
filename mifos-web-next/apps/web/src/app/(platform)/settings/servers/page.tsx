import { AppLink } from '@/components/routes/app-link';
import { getServerCatalog } from '@/lib/servers/catalog-store';
import { ServerForm } from '@/components/servers/server-form';
import { addServerAction } from '@/actions/servers';
import { logoutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { ServerSettingsRow } from '@/components/servers/server-settings-row';

export default async function ServerSettingsPage() {
  const catalog = await getServerCatalog();

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <AppLink route="dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </AppLink>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Fineract servers</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage named backends and tenants. Sign out to switch servers before logging in again.
        </p>
      </div>

      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Configured servers</h3>
        {catalog.servers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No servers yet.{' '}
            <AppLink route="connect" className="text-primary underline-offset-4 hover:underline">
              Add one on the connect screen
            </AppLink>
            .
          </p>
        ) : (
          <ul className="space-y-4">
            {catalog.servers.map((server) => (
              <ServerSettingsRow
                key={server.id}
                server={server}
                isActive={server.id === catalog.activeServerId}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border p-6">
        <h3 className="mb-4 text-sm font-semibold">Add server</h3>
        <ServerForm submitLabel="Add server" onSubmit={(values) => addServerAction(values)} />
      </div>
    </div>
  );
}
