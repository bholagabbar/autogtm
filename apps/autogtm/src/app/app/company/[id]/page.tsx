import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { CompanyEdit } from '@/components/CompanyEdit';

export default async function CompanyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  const { id } = await params;

  if (!user) {
    redirect('/login');
  }

  return <CompanyEdit companyId={id} />;
}
