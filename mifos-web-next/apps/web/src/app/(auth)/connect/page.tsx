import { ServerList } from '@/components/servers/server-list';
import { ConnectServerForm } from '@/components/servers/connect-server-form';
import { getServerCatalog } from '@/lib/servers/catalog-store';
import { AppLink } from '@/components/routes/app-link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function ConnectPage() {
  const catalog = await getServerCatalog();
  const isEmpty = catalog.servers.length === 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Connect to Fineract</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose or add the backend you want to use. You can change this anytime before login or
            in settings after signing out.
          </p>
        </div>

        {isEmpty ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm font-medium">No servers configured</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first Fineract instance to continue. Display name helps you switch between
              sandbox, staging, and production.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Your servers</h2>
            <ServerList servers={catalog.servers} activeServerId={catalog.activeServerId} />
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">
            {isEmpty ? 'Add your first server' : 'Add another server'}
          </h2>
          <ConnectServerForm isEmpty={isEmpty} />
        </div>

        {!isEmpty && catalog.activeServerId ? (
          <div className="text-center">
            <AppLink route="login" className={cn(buttonVariants())}>
              Continue to sign in
            </AppLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}
