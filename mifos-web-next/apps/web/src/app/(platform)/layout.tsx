import { AppShell } from '@mifos/ui';
import { filterNavForUser } from '@mifos/auth';
import { PlatformHeader } from '@/components/platform/platform-header';
import { PlatformSidebar } from '@/components/platform/platform-sidebar';
import { getServerSession } from '@/lib/session/server';
import { isRbacEnabled } from '@/lib/session/dev-user';
import { SessionProvider } from '@/providers/session-provider';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSession();
  const navItems = filterNavForUser(user).map(({ href, label }) => ({ href, label }));

  return (
    <SessionProvider user={user} rbacEnabled={isRbacEnabled()}>
      <AppShell sidebar={<PlatformSidebar items={navItems} />} header={<PlatformHeader />}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
