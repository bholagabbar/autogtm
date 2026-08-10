'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export interface CompanyDomainView {
  id: string;
  company_id: string;
  domain: string;
  verification_status: 'unverified' | 'verification_pending' | 'verified' | 'dns_error';
  created_at: string;
  updated_at: string;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  unverified: { label: 'Unverified', icon: <AlertTriangle className="h-3.5 w-3.5" />, className: 'bg-yellow-50 text-yellow-700' },
  verification_pending: { label: 'Pending', icon: <Clock className="h-3.5 w-3.5" />, className: 'bg-gray-100 text-gray-600' },
  verified: { label: 'Verified', icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: 'bg-green-50 text-green-700' },
  dns_error: { label: 'DNS error', icon: <AlertTriangle className="h-3.5 w-3.5" />, className: 'bg-red-50 text-red-700' },
};

interface DomainConnectionPanelProps {
  companyId: string;
  domains: CompanyDomainView[];
  onChanged: () => void;
}

export function DomainConnectionPanel({ companyId, domains, onChanged }: DomainConnectionPanelProps) {
  const [domain, setDomain] = useState('');
  const [adding, setAdding] = useState(false);

  const addDomain = async () => {
    if (!domain) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      if (res.ok) {
        setDomain('');
        onChanged();
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Sending Domains</h3>
      <div className="space-y-2 mb-3">
        {domains.length === 0 && (
          <p className="text-xs text-gray-500">No domains added yet.</p>
        )}
        {domains.map((d) => {
          const meta = STATUS_META[d.verification_status] ?? STATUS_META.verification_pending;
          return (
            <div key={d.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
              <span className="text-sm text-gray-800">{d.domain}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                {meta.icon}
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="anchoreduniforms.co.za"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1"
          disabled={adding}
        />
        <Button type="button" size="sm" onClick={addDomain} disabled={adding || !domain}>
          {adding ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add
        </Button>
      </div>
    </div>
  );
}
