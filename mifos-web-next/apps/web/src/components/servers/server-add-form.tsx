'use client';

import { useRouter } from 'next/navigation';
import { ServerForm } from '@/components/servers/server-form';
import { addServerAction } from '@/actions/servers';

export function ServerAddForm() {
  const router = useRouter();

  return (
    <ServerForm
      submitLabel="Add server"
      onSubmit={async (values) => {
        const result = await addServerAction(values);
        if (result.ok) {
          router.refresh();
        }
        return result;
      }}
    />
  );
}
