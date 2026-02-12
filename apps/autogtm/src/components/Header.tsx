'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogOut, Plus, Building2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface HeaderProps {
  userEmail: string;
}

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    // Load selected company from localStorage
    const stored = localStorage.getItem('autogtm_selected_company');
    if (stored && companies.find(c => c.id === stored)) {
      setSelectedCompanyId(stored);
    } else if (companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
      localStorage.setItem('autogtm_selected_company', companies[0].id);
      window.dispatchEvent(new Event('autogtm_company_changed'));
    }
  }, [companies]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    localStorage.setItem('autogtm_selected_company', companyId);
    window.dispatchEvent(new Event('autogtm_company_changed'));
    router.refresh();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/app" className="flex items-center gap-0">
            <span className="font-black text-xl tracking-tight text-gray-900">auto</span>
            <span className="font-black text-xl tracking-tight text-white bg-indigo-600 px-1.5 py-0.5 rounded-md ml-0.5">gtm</span>
          </Link>
          
          {!loading && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              {companies.length > 0 ? (
                <Select value={selectedCompanyId || undefined} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <Link href="/app/setup" className="block">
                      <div className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                        <Plus className="absolute left-2 h-4 w-4" />
                        Add New Company
                      </div>
                    </Link>
                  </SelectContent>
                </Select>
              ) : (
                <Link href="/app/setup">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Company
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{userEmail}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500 hover:text-gray-900">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// Hook to get selected company ID
export function useSelectedCompany(): string | null {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    setCompanyId(localStorage.getItem('autogtm_selected_company'));
    
    const handleChange = () => {
      setCompanyId(localStorage.getItem('autogtm_selected_company'));
    };
    window.addEventListener('storage', handleChange);
    window.addEventListener('autogtm_company_changed', handleChange);
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('autogtm_company_changed', handleChange);
    };
  }, []);

  return companyId;
}
