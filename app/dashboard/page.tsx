import { Dashboard } from '@/features/dashboard/components';

// Force dynamic rendering (Dashboard uses useSearchParams for tab routing)
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <Dashboard />;
}