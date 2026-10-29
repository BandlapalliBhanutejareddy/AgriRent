'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MarketRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/weather');
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
      Redirecting to Weather & Advisories...
    </div>
  );
}
