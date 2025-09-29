'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Przekieruj do aplikacji mapowej
    router.replace('/map');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🗺️ Universe MapMaker</h1>
        <p>Przekierowywanie do aplikacji...</p>
      </div>
    </div>
  );
}

