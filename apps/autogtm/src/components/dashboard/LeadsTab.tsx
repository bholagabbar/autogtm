'use client';

import { Users, Search, ArrowDownWideNarrow, X, CheckCircle2, Loader2, Check } from 'lucide-react';
import { LeadDraftDialog, LeadDraftView } from '@/components/dashboard/LeadDraftDialog';

export interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  url: string;
  platform: string | null;
  follower_count: number | null;
  enrichment_data: any;
  created_at: string;
  query_id: string;
  exa_queries?: { id: string; query: string; source_instruction_id: string | null; instruction_content: string | null };
  category: string | null;
  full_name: string | null;
  title: string | null;
  bio: string | null;
  expertise: string[] | null;
  social_links: Record<string, string> | null;
  total_audience: number | null;
  content_types: string[] | null;
  promotion_fit_score: number | null;
  promotion_fit_reason: string | null;
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed';
  enriched_at: string | null;
  suggested_campaign_id: string | null;
  suggested_campaign_reason: string | null;
  campaign_id: string | null;
  campaign_status: 'pending' | 'routed' | 'skipped' | null;
  skip_reason: string | null;
}

export type LeadFilter = 'all' | 'suggested' | 'routed' | 'pending' | 'skipped';

interface LeadsTabProps {
  leads: LeadRow[];
  queries: Array<{ id: string; query: string }>;
  leadFilter: LeadFilter;
  setLeadFilter: (f: LeadFilter) => void;
  leadSearch: string;
  setLeadSearch: (s: string) => void;
  leadSort: 'default' | 'score';
  setLeadSort: (s: 'default' | 'score') => void;
  selectedQueryFilter: string;
  setSelectedQueryFilter: (s: string) => void;
  enrichingLeads: Set<string>;
  routingLeads: Set<string>;
  suggestingLeads: Set<string>;
  onSelectLead: (lead: LeadRow) => void;
  onSkip: (leadId: string) => void;
  onUnskip: (leadId: string) => void;
  onSuggestCampaign: (leadId: string) => void;
  onEnrich: (leadId: string) => void;
  onMarkSent?: (lead: LeadRow, draft: LeadDraftView) => void;
}

export function LeadsTab(props: LeadsTabProps) {
  const {
    leads,
    queries,
    leadFilter,
    setLeadFilter,
    leadSearch,
    setLeadSearch,
    leadSort,
    setLeadSort,
    selectedQueryFilter,
    setSelectedQueryFilter,
    enrichingLeads,
    routingLeads,
    suggestingLeads,
    onSelectLead,
    onSkip,
    onUnskip,
    onSuggestCampaign,
    onEnrich,
    onMarkSent,
  } = props;

  const filteredLeads = selectedQueryFilter === 'all'
    ? leads
    : leads.filter((l) => l.query_id === selectedQueryFilter);

  const textFiltered = leadSearch.trim()
    ? filteredLeads.filter((l) =>
        [l.full_name, l.name, l.bio, l.category]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(leadSearch.toLowerCase()))
      )
    : filteredLeads;

  const suggestedLeads = textFiltered.filter((l) => l.suggested_campaign_id && l.campaign_status !== 'routed');
  const routedLeads = textFiltered.filter((l) => l.campaign_status === 'routed');
  const pendingLeads = textFiltered.filter((l) => !l.suggested_campaign_id && l.campaign_status !== 'routed' && l.campaign_status !== 'skipped');
  const skippedLeads = textFiltered.filter((l) => l.campaign_status === 'skipped');

  const filterCounts = {
    all: textFiltered.length,
    suggested: suggestedLeads.length,
    routed: routedLeads.length,
    pending: pendingLeads.length,
    skipped: skippedLeads.length,
  };

  const sortedAll = [...textFiltered].sort((a, b) => {
    const order = (l: LeadRow) =>
      l.suggested_campaign_id && l.campaign_status !== 'routed' ? 0 :
        l.campaign_status === 'routed' ? 1 :
          l.enrichment_status === 'enriching' ? 3 :
            l.campaign_status === 'skipped' ? 4 : 2;
    return order(a) - order(b);
  });
  const baseDisplay = leadFilter === 'all' ? sortedAll :
    leadFilter === 'suggested' ? suggestedLeads :
      leadFilter === 'routed' ? routedLeads :
        leadFilter === 'skipped' ? skippedLeads : pendingLeads;

  const displayLeads = leadSort === 'score'
    ? [...baseDisplay].sort((a, b) => (b.promotion_fit_score ?? -1) - (a.promotion_fit_score ?? -1))
    : baseDisplay;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {([
              { key: 'all' as const, label: 'All' },
              { key: 'suggested' as const, label: 'Ready to Add' },
              { key: 'routed' as const, label: 'In Campaign' },
              { key: 'pending' as const, label: 'Pending' },
              { key: 'skipped' as const, label: 'Skipped' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLeadFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  leadFilter === key
                    ? 'bg-gray-900 text-white'
                    : key === 'suggested' && filterCounts[key] > 0
                      ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label} ({filterCounts[key]})
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Search name, bio, category..."
              className="text-xs border border-gray-200 rounded-lg pl-7 pr-7 py-1.5 bg-white text-gray-700 w-56 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            {leadSearch && (
              <button
                onClick={() => setLeadSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setLeadSort(leadSort === 'score' ? 'default' : 'score')}
            title={leadSort === 'score' ? 'Sorted by fit score (click to reset)' : 'Sort by fit score (high to low)'}
            aria-label="Sort by fit score"
            className={`p-1.5 rounded-lg border transition-colors ${
              leadSort === 'score'
                ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
          </button>
          {queries.length > 0 && (
            <select
              value={selectedQueryFilter}
              onChange={(e) => setSelectedQueryFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
            >
              <option value="all">All Searches ({leads.length})</option>
              {queries.map((q) => {
                const count = leads.filter((l) => l.query_id === q.id).length;
                return (
                  <option key={q.id} value={q.id}>
                    {q.query.slice(0, 30)}{q.query.length > 30 ? '...' : ''} ({count})
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>

      {displayLeads.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            {leadFilter === 'suggested' ? 'No leads ready to add to campaigns yet.' :
              leadFilter === 'routed' ? 'No leads in campaigns yet.' :
                leadFilter === 'skipped' ? 'No skipped leads.' :
                  leadFilter === 'pending' ? 'No pending leads.' :
                    'No leads yet. Run a search to find leads.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayLeads.map((lead) => {
            const hasSuggestedCampaign = !!lead.suggested_campaign_id;
            const isEnriched = lead.enrichment_status === 'enriched';
            const isUnenriched = lead.enrichment_status === 'pending' || lead.enrichment_status === 'failed';

            return (
              <div
                key={lead.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  hasSuggestedCampaign && lead.campaign_status !== 'routed'
                    ? 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-300'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelectLead(lead)}
              >
                <div className="flex items-center gap-3">
                  {/* Left: Fit score */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-[40px]">
                    {lead.promotion_fit_score ? (
                      <span className={`text-sm font-bold ${
                        lead.promotion_fit_score >= 7 ? 'text-green-600' :
                          lead.promotion_fit_score >= 4 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {lead.promotion_fit_score}/10
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">--</span>
                    )}
                  </div>

                  {/* Center: Name, Title, Email, Search */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {lead.full_name || lead.name || 'Unknown'}
                    </p>
                    {lead.title && (
                      <p className="text-xs text-gray-500 truncate">{lead.title}</p>
                    )}
                    {lead.exa_queries?.query && (
                      <div className="flex items-center gap-1 mt-1">
                        <Search className="h-3 w-3 text-gray-300 shrink-0" />
                        <p className="text-xs text-gray-400 truncate" title={lead.exa_queries.query}>
                          {lead.exa_queries.query}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Campaign suggestion / status */}
                  <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {lead.campaign_status === 'routed' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Added
                        </span>
                      </div>
                    ) : routingLeads.has(lead.id) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Starting...
                      </span>
                    ) : hasSuggestedCampaign ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium whitespace-nowrap transition-colors"
                        >
                          <Check className="h-3 w-3" />
                          Ready to Review
                        </button>
                        <button
                          onClick={async () => { onSkip(lead.id); }}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium whitespace-nowrap transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Skip
                        </button>
                      </div>
                    ) : lead.campaign_status === 'skipped' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Skipped{lead.skip_reason ? `: ${lead.skip_reason}` : ''}</span>
                        <button
                          onClick={async () => { onUnskip(lead.id); }}
                          className="text-xs px-2 py-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors"
                        >
                          Undo
                        </button>
                      </div>
                    ) : lead.enrichment_status === 'enriching' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Enriching
                      </span>
                    ) : isEnriched && lead.email ? (
                      <button
                        onClick={() => onSuggestCampaign(lead.id)}
                        disabled={suggestingLeads.has(lead.id)}
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-medium"
                      >
                        {suggestingLeads.has(lead.id) ? (
                          <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Generating...</span>
                        ) : 'Generate Campaign'}
                      </button>
                    ) : isUnenriched ? (
                      <button
                        onClick={() => onEnrich(lead.id)}
                        disabled={enrichingLeads.has(lead.id)}
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-medium"
                      >
                        {enrichingLeads.has(lead.id) ? '...' : 'Enrich'}
                      </button>
                    ) : null}
                    <LeadDraftDialog
                      leadId={lead.id}
                      leadName={lead.full_name || lead.name || 'Unknown'}
                      onMarkSent={onMarkSent ? (draft) => onMarkSent!(lead, draft) : undefined}
                      onChanged={() => onSelectLead(lead)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
