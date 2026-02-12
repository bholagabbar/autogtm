import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { Dashboard } from '@/components/Dashboard';

export default async function HomePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <Dashboard userEmail={user.email || ''} />;
}
