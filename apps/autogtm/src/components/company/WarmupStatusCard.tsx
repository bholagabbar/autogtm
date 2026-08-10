'use client';

interface WarmupStatusCardProps {
  warmupState: 'not_started' | 'warming' | 'ready' | 'paused';
  warmupDay: number;
  dailyCap: number;
  onChange?: (updates: { warmup_state?: string; warmup_day?: number; daily_cap?: number }) => void;
}

const STATE_LABELS: Record<string, string> = {
  not_started: 'Not started',
  warming: 'Warming up',
  ready: 'Ready',
  paused: 'Paused',
};

export function WarmupStatusCard({ warmupState, warmupDay, dailyCap, onChange }: WarmupStatusCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Warmup</h3>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {STATE_LABELS[warmupState] ?? warmupState}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Day</dt>
          <dd className="font-medium text-gray-900">{warmupDay}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Daily cap</dt>
          <dd className="font-medium text-gray-900">{dailyCap}</dd>
        </div>
      </dl>
      {onChange && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(['not_started', 'warming', 'ready', 'paused'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ warmup_state: s })}
              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              {STATE_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
