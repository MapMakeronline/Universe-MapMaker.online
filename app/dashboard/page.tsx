import Dashboard from '../../src/components/dashboard/Dashboard';

// Force dynamic rendering (Dashboard uses useSearchParams for tab routing)
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <Dashboard />;
}