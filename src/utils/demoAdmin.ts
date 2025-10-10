/**
 * Demo Admin Mode - dla testów lokalnych bez backendu
 *
 * Pozwala zalogować się jako admin bez połączenia z API
 */

import { User } from '@/api/typy/types';

export const DEMO_ADMIN_USER: User = {
  id: 999,
  username: 'admin',
  email: 'admin@universemapmaker.online',
  first_name: 'Admin',
  last_name: 'Demo',
};

export const DEMO_ADMIN_TOKEN = 'demo-admin-token-local-only';

/**
 * Włącz tryb demo admin (zapisuje do localStorage)
 */
export function enableDemoAdminMode() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', DEMO_ADMIN_TOKEN);
    localStorage.setItem('user', JSON.stringify(DEMO_ADMIN_USER));
    console.log('✅ Demo Admin Mode ENABLED');
    console.log('👤 Zalogowano jako:', DEMO_ADMIN_USER.username);
    console.log('📧 Email:', DEMO_ADMIN_USER.email);
  }
}

/**
 * Wyłącz tryb demo admin (czyści localStorage)
 */
export function disableDemoAdminMode() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('❌ Demo Admin Mode DISABLED');
  }
}

/**
 * Sprawdź czy tryb demo admin jest aktywny
 */
export function isDemoAdminMode(): boolean {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    return token === DEMO_ADMIN_TOKEN;
  }
  return false;
}

/**
 * Pobierz dane użytkownika demo admin
 */
export function getDemoAdminUser(): User | null {
  if (typeof window !== 'undefined' && isDemoAdminMode()) {
    return DEMO_ADMIN_USER;
  }
  return null;
}
