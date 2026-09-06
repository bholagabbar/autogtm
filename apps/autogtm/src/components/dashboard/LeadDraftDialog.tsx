'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileText, Send, Check } from 'lucide-react';

export interface LeadDraftView {
  id: string;
  lead_id: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent_manual';
  created_at: string;
  updated_at: string;
}

interface LeadDraftDialogProps {
  leadId: string;
  leadName: string;
  // When a draft already exists for the lead, pass it in to skip generation.
  existingDraft?: LeadDraftView | null;
  // Called after a successful generate / edit / mark-sent so the parent can refetch.
  onChanged?: () => void;
  onMarkSent?: (draft: LeadDraftView) => void;
}

export function LeadDraftDialog({
  leadId,
  leadName,
  existingDraft,
  onChanged,
  onMarkSent,
}: LeadDraftDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [draft, setDraft] = useState<LeadDraftView | null>(existingDraft ?? null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existingDraft) {
      setDraft(existingDraft);
      setSubject(existingDraft.subject);
      setBody(existingDraft.body);
      return;
    }
    // No draft passed in — fetch any existing one so we don't double-generate.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}/draft`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.drafts?.length > 0) {
          const d = data.drafts[0];
          setDraft(d);
          setSubject(d.subject);
          setBody(d.body);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [open, existingDraft, leadId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/draft`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate draft');
      }
      const data = await res.json();
      setDraft(data);
      setSubject(data.subject);
      setBody(data.body);
      onChanged?.();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message || 'Failed to generate draft' });
    } finally {
      setGenerating(false);
    }
  };

  const saveEdit = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/draft`, { method: 'PATCH', body: JSON.stringify({ subject, body }) });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setDraft(data);
      onChanged?.();
      toast({ title: 'Draft saved' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium whitespace-nowrap"
        >
          <FileText className="h-3 w-3 mr-1" />
          {draft ? 'Review Draft' : 'Generate Draft'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Outreach Draft — {leadName}</DialogTitle>
        </DialogHeader>

        {!draft ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500 mb-4">No draft yet. Generate a personalized cold email for this lead.</p>
            <Button onClick={generate} disabled={generating}>
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : 'Generate Draft'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full mt-1 text-sm font-mono border border-gray-200 rounded-lg p-3 bg-white text-gray-800 resize-y focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {draft.status === 'sent_manual' ? 'Marked sent manually' : 'Draft'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={saveEdit} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : 'Save Edit'}
                </Button>
                {draft.status !== 'sent_manual' && onMarkSent && (
                  <Button onClick={() => onMarkSent(draft!)}>
                    <Send className="h-4 w-4 mr-1" /> Mark Sent Manually
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogClose asChild>
          <Button variant="ghost" className="absolute right-4 top-4">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
