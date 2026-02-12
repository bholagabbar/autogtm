import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { CompanySetup } from '@/components/CompanySetup';

export default async function SetupPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <CompanySetup />;
}
