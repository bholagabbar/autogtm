'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Search,
  Loader2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Trash2,
} from 'lucide-react';

export interface QueryRow {
  id: string;
  query: string;
  criteria: string[];
  status: string;
  is_active: boolean;
  last_run_at: string | null;
  company_updates?: { content: string } | null;
  webset_runs?: Array<{ webset_id: string; status: string }>;
}

interface SearchesTabProps {
  queries: QueryRow[];
  companyId: string | null;
  generatingQueries: boolean;
  runningQueries: Record<string, { progress: number; found: number }>;
  onGenerate: () => Promise<void>;
  onRun: (queryId: string) => void;
  onDelete: (queryId: string) => void;
  onRefresh: () => void;
}

function formatLastRun(date: string | null): string {
  if (!date) return 'Never';
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <span className="inline-flex items-center gap-1 text-green-600"><CheckDot /> Done</span>;
    case 'failed':
      return <span className="inline-flex items-center gap-1 text-red-500"><XDot /> Failed</span>;
    case 'running':
      return <span className="inline-flex items-center gap-1 text-amber-600"><Loader2 className="h-3 w-3 animate-spin" /> Running</span>;
    default:
      return <span className="inline-flex items-center gap-1 text-gray-400">Pending</span>;
  }
}

function CheckDot() {
  return <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />;
}
function XDot() {
  return <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />;
}

export function SearchesTab({
  queries,
  companyId,
  generatingQueries,
  runningQueries,
  onGenerate,
  onRun,
  onDelete,
  onRefresh,
}: SearchesTabProps) {
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!companyId) return;
    try {
      await onGenerate();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to generate search' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">AI-generated searches based on your instructions, runs automatically daily at 9AM to discover new leads</p>
        <Button
          size="sm"
          disabled={generatingQueries}
          onClick={handleGenerate}
        >
          {generatingQueries ? (
            <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-3 w-3 mr-1.5" /> Generate Search</>
          )}
        </Button>
      </div>
      {queries.length === 0 ? (
        <div className="py-12 text-center">
          <Search className="h-10 w-10 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No searches yet. Add instructions and generate your first search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Query</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Last Run</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((query) => (
                <tr key={query.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {getStatusIcon(query.status)}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{query.query}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {query.company_updates?.content ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                          From: {query.company_updates.content.length > 40
                            ? query.company_updates.content.substring(0, 40) + '...'
                            : query.company_updates.content}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">
                          Exploration
                        </span>
                      )}
                      {query.criteria?.slice(0, 2).map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatLastRun(query.last_run_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end items-center gap-2">
                      {runningQueries[query.id] ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[100px]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>
                            {runningQueries[query.id].found > 0
                              ? `Found ${runningQueries[query.id].found}...`
                              : 'Searching...'}
                          </span>
                        </div>
                      ) : !query.webset_runs?.[0]?.webset_id ? (
                        <Button
                          size="sm"
                          onClick={() => onRun(query.id)}
                          disabled={query.status === 'running'}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Run
                        </Button>
                      ) : null}
                      {query.webset_runs?.[0]?.webset_id && (
                        <a
                          href={`https://websets.exa.ai/websets/${query.webset_runs[0].webset_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Exa
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(query.id)}
                        className="text-red-500 hover:text-red-600"
                        disabled={!!runningQueries[query.id]}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
