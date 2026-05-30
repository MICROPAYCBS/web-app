import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="max-w-md text-muted-foreground">
        Your account does not have permission to view this area. Contact an administrator if you
        believe this is an error.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Back to dashboard
      </Link>
    </div>
  );
}
