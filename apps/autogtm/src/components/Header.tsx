'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, Building2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  system_enabled: boolean;
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
    if (companyId === selectedCompanyId) return;
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
              <span className="flex items-center gap-1 text-gray-400">
                <Building2 className="h-4 w-4" />
                {companies.length > 0 && (
                  <span className="text-xs font-medium">({companies.length})</span>
                )}
              </span>
              {companies.length > 0 ? (
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
                  {companies.map((company) => {
                    const isSelected = company.id === selectedCompanyId;
                    return (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => handleCompanyChange(company.id)}
                        title={company.system_enabled ? 'System on' : 'System off'}
                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${company.system_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                        <span className="truncate max-w-[140px]">{company.name}</span>
                      </button>
                    );
                  })}
                  <Link
                    href="/app/setup"
                    title="Add new profile"
                    className="flex items-center justify-center rounded-full px-2.5 py-1.5 text-gray-400 hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Link>
                </div>
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
