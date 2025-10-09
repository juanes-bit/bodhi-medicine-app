'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/bodhi';

type UseAuthOptions = {
  redirectTo?: string;
};

type MeData = {
  logged_in: boolean;
  id?: number;
  name?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeData | null>(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getMe();
        if (!alive) return;
        setMe(res);
        if (!res.logged_in && options?.redirectTo) {
          router.replace(options.redirectTo);
        }
      } catch {
        if (options?.redirectTo) router.replace(options.redirectTo);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, options?.redirectTo]);

  return { me, loading };
}
