'use client';

import { useEffect } from 'react';
import { LicenseInfo } from '@mui/x-license';

/**
 * MUI X Pro License Initializer
 *
 * This component MUST be rendered early in the component tree
 * to initialize the MUI X Pro license before DataGridPro renders.
 *
 * NOTE: NEXT_PUBLIC_* env vars are embedded at BUILD TIME, not runtime.
 * If you change the license key, you MUST rebuild the app.
 */
export function MuiLicenseInitializer() {
  useEffect(() => {
    const licenseKey = process.env.NEXT_PUBLIC_MUI_LICENSE_KEY;

    console.log('🔑 MUI X License Initializer Debug:', {
      hasLicenseKey: !!licenseKey,
      keyLength: licenseKey?.length || 0,
      keyPreview: licenseKey ? `${licenseKey.substring(0, 20)}...` : 'undefined',
      allEnvVars: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'present' : 'missing',
        NEXT_PUBLIC_MUI_LICENSE_KEY: process.env.NEXT_PUBLIC_MUI_LICENSE_KEY ? 'present' : 'missing',
      }
    });

    if (licenseKey) {
      try {
        LicenseInfo.setLicenseKey(licenseKey);
        console.log('✅ MUI X Pro license initialized successfully');
      } catch (error) {
        console.error('❌ MUI X Pro license initialization failed:', error);
      }
    } else {
      console.error('❌ NEXT_PUBLIC_MUI_LICENSE_KEY is undefined! Check:');
      console.error('   1. .env.local has NEXT_PUBLIC_MUI_LICENSE_KEY=...');
      console.error('   2. cloudbuild.yaml has --build-arg NEXT_PUBLIC_MUI_LICENSE_KEY=...');
      console.error('   3. You ran "npm run build" after adding the key');
    }
  }, []);

  return null; // This component renders nothing
}
