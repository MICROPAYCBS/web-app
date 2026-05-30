import { AppLink } from '@/components/routes/app-link';
import { Button } from '@/components/ui/button';
import { getActiveFineractServer } from '@/lib/servers/catalog-store';
import { redirect } from 'next/navigation';
import { DemoLoginButton } from '@/components/auth/demo-login-button';
import { isDemoSessionEnabled } from '@/lib/session/demo-session';

export default async function LoginPage() {
  const demoEnabled = isDemoSessionEnabled();
  const active = await getActiveFineractServer();
  if (!active) {
    redirect('/connect');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fineract server
          </p>
          <p className="mt-1 font-medium">{active.name}</p>
          <p className="text-xs text-muted-foreground">Tenant: {active.tenantId}</p>
          <AppLink
            route="connect"
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Change server
          </AppLink>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Authentication will connect to this server via the app backend (not from your
              browser).
            </p>
          </div>
          <Button className="w-full" disabled>
            Continue (coming soon)
          </Button>
          {demoEnabled ? (
            <DemoLoginButton className="mt-3 w-full" />
          ) : null}
          {demoEnabled ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Preview deployment — demo session only. Do not use in production.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
