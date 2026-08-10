'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, CheckCircle2, KeyRound } from 'lucide-react';
import { WarmupStatusCard } from './WarmupStatusCard';

export interface CompanyMailboxView {
  id: string;
  company_id: string;
  provider: string;
  label: string;
  connection_status: 'unconnected' | 'credentials_saved' | 'verified' | 'connection_error';
  warmup_state: 'not_started' | 'warming' | 'ready' | 'paused';
  warmup_day: number;
  daily_cap: number;
  created_at: string;
  updated_at: string;
}

interface MailboxConnectionPanelProps {
  companyId: string;
  mailboxes: CompanyMailboxView[];
  onChanged: () => void;
}

export function MailboxConnectionPanel({ companyId, mailboxes, onChanged }: MailboxConnectionPanelProps) {
  const [label, setLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const addMailbox = async () => {
    if (!label) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/mailboxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, provider: 'smtp', connection_status: 'credentials_saved' }),
      });
      if (res.ok) {
        setLabel('');
        onChanged();
      }
    } finally {
      setAdding(false);
    }
  };

  const updateWarmup = async (mailboxId: string, updates: { warmup_state?: string; warmup_day?: number; daily_cap?: number }) => {
    // Persist via the warmup route (dev-safe; no external provider contacted).
    await fetch(`/api/companies/${companyId}/warmup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mailboxId, ...updates }),
    });
    onChanged();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Mailboxes</h3>
      <div className="space-y-3 mb-3">
        {mailboxes.length === 0 && (
          <p className="text-xs text-gray-500">No mailboxes connected yet.</p>
        )}
        {mailboxes.map((m) => (
          <div key={m.id} className="rounded-md border border-gray-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-800">
                <KeyRound className="h-3.5 w-3.5 text-gray-400" />
                {m.label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                {m.connection_status === 'verified' && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                {m.connection_status}
              </span>
            </div>
            <WarmupStatusCard
              warmupState={m.warmup_state}
              warmupDay={m.warmup_day}
              dailyCap={m.daily_cap}
              onChange={(u) => updateWarmup(m.id, u)}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="outreach@anchoreduniforms.co.za"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1"
          disabled={adding}
        />
        <Button type="button" size="sm" onClick={addMailbox} disabled={adding || !label}>
          {adding ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add
        </Button>
      </div>
    </div>
  );
}
