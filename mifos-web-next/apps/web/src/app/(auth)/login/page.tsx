import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getActiveFineractServer } from '@/lib/servers/catalog-store';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
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
          <Link
            href="/connect"
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Change server
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Authentication will connect to this server via the app backend (not from your
              browser).
            </p>
          </div>
          <Button className="mt-6 w-full" disabled>
            Continue (coming soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
