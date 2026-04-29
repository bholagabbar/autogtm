'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

type SocialSubTab = 'themes' | 'schedule' | 'plan' | 'queue' | 'calendar';

interface SocialTheme {
  id: string;
  name: string;
  purpose: string;
  caption_prompt: string;
  image_prompt_template: string;
  brand_voice: string;
  priority: number;
  is_active: boolean;
}

interface SocialSchedule {
  preset: string;
  timezone: string;
  slots: Array<{ day_of_week: number; hour_utc: number; theme_id?: string | null }>;
}

interface SocialWeekPlan {
  id: string;
  week_start_date: string;
  status: string;
  planner_summary: Record<string, unknown>;
}

interface SocialPost {
  id: string;
  status: string;
  scheduled_for: string;
  caption: string | null;
  theme_id: string | null;
  image_status?: string | null;
  image_url?: string | null;
  error?: string | null;
}

interface SocialDataItem {
  id: string;
  raw_text: string;
  status: string;
  theme_id: string | null;
  classification_confidence: number | null;
}

const schedulePresetOptions = [
  { id: 'creator_daily', label: 'Creator Daily' },
  { id: 'creator_mwf', label: 'Creator MWF' },
  { id: 'brand_weekday', label: 'Brand Weekday' },
  { id: 'brand_heavy', label: 'Brand Heavy' },
  { id: 'weekly_pulse', label: 'Weekly Pulse' },
  { id: 'custom', label: 'Custom' },
];

export function SocialsPanel({ companyId }: { companyId: string }) {
  const [activeTab, setActiveTab] = useState<SocialSubTab>('queue');
  const [loading, setLoading] = useState(false);

  const [themes, setThemes] = useState<SocialTheme[]>([]);
  const [schedule, setSchedule] = useState<SocialSchedule | null>(null);
  const [weekPlans, setWeekPlans] = useState<SocialWeekPlan[]>([]);
  const [planPosts, setPlanPosts] = useState<SocialPost[]>([]);
  const [queuePosts, setQueuePosts] = useState<SocialPost[]>([]);
  const [dataItems, setDataItems] = useState<SocialDataItem[]>([]);
  const [creatingTheme, setCreatingTheme] = useState(false);
  const [archivingThemes, setArchivingThemes] = useState(false);
  const [showCreateThemeForm, setShowCreateThemeForm] = useState(false);
  const [themeDataDrafts, setThemeDataDrafts] = useState<Record<string, string>>({});
  const [addingDataThemeId, setAddingDataThemeId] = useState<string | null>(null);
  const [generatingDraftThemeId, setGeneratingDraftThemeId] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState({
    name: '',
    purpose: '',
    caption_prompt: '',
    image_prompt_template: '',
    brand_voice: '',
    priority: 5,
  });

  async function fetchSocialsData() {
    setLoading(true);
    try {
      const [themesRes, scheduleRes, plansRes, queueRes, itemsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}/social/themes`),
        fetch(`/api/companies/${companyId}/social/schedule`),
        fetch(`/api/companies/${companyId}/social/week-plans`),
        fetch(`/api/companies/${companyId}/social/posts`),
        fetch(`/api/companies/${companyId}/social/items`),
      ]);

      let fetchedThemes: SocialTheme[] = [];
      if (themesRes.ok) {
        const data = await themesRes.json();
        fetchedThemes = data.themes || [];
        setThemes(fetchedThemes);
      }
      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        setSchedule(data.schedule || null);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setWeekPlans(data.plans || []);
      }
      if (queueRes.ok) {
        const data = await queueRes.json();
        let posts = data.posts || [];

        // Auto-clean orphan posts (theme archived/removed) so queue never shows stale entries.
        if (fetchedThemes.length > 0 && posts.length > 0) {
          const activeThemeIds = new Set(fetchedThemes.map((theme) => theme.id));
          const orphanPosts = posts.filter(
            (post: SocialPost) =>
              post.theme_id &&
              !activeThemeIds.has(post.theme_id) &&
              post.status !== 'published' &&
              post.status !== 'cancelled'
          );

          if (orphanPosts.length > 0) {
            await Promise.all(
              orphanPosts.map((post: SocialPost) =>
                fetch(`/api/companies/${companyId}/social/posts/${post.id}/cancel`, { method: 'POST' })
              )
            );
            const refreshedQueueRes = await fetch(`/api/companies/${companyId}/social/posts`);
            if (refreshedQueueRes.ok) {
              const refreshedQueueData = await refreshedQueueRes.json();
              posts = refreshedQueueData.posts || [];
            }
          }
        }

        setQueuePosts(posts);
      }
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setDataItems(data.items || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPlanPosts(planId: string) {
    const res = await fetch(`/api/companies/${companyId}/social/week-plans/${planId}`);
    if (!res.ok) return;
    const data = await res.json();
    setPlanPosts(data.posts || []);
  }

  useEffect(() => {
    void fetchSocialsData();
  }, [companyId]);

  async function handleCreateTheme() {
    if (!newTheme.name.trim()) return;
    setCreatingTheme(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/social/themes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTheme),
      });
      if (res.ok) {
        setNewTheme({
          name: '',
          purpose: '',
          caption_prompt: '',
          image_prompt_template: '',
          brand_voice: '',
          priority: 5,
        });
        await fetchSocialsData();
      }
    } finally {
      setCreatingTheme(false);
    }
  }

  async function handleSchedulePresetChange(preset: string) {
    await fetch(`/api/companies/${companyId}/social/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset }),
    });
    await fetchSocialsData();
  }

  async function handleReplanWeek(weekStartDate?: string) {
    await fetch(`/api/companies/${companyId}/social/week-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start_date: weekStartDate }),
    });
    await fetchSocialsData();
  }

  async function handleApprovePlan(planId: string) {
    await fetch(`/api/companies/${companyId}/social/week-plans/${planId}/approve`, {
      method: 'POST',
    });
    await fetchSocialsData();
    await loadPlanPosts(planId);
  }

  async function handleAddDataToTheme(themeId: string) {
    const rawContent = (themeDataDrafts[themeId] || '').trim();
    if (!rawContent) return;
    setAddingDataThemeId(themeId);
    try {
      await fetch(`/api/companies/${companyId}/social/themes/${themeId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_content: rawContent, source: 'paste' }),
      });
      setThemeDataDrafts((prev) => ({ ...prev, [themeId]: '' }));
      await fetchSocialsData();
    } finally {
      setAddingDataThemeId(null);
    }
  }

  async function handleGenerateOneDraft(themeId: string) {
    setGeneratingDraftThemeId(themeId);
    try {
      await fetch(`/api/companies/${companyId}/social/themes/${themeId}/draft-one`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      await fetchSocialsData();
    } finally {
      setGeneratingDraftThemeId(null);
    }
  }

  async function handleApproveAndGenerate(postId: string, mode: 'video' | 'image') {
    await fetch(`/api/companies/${companyId}/social/posts/${postId}/approve`, { method: 'POST' });
    await fetch(`/api/companies/${companyId}/social/posts/${postId}/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    await fetchSocialsData();
  }

  async function handleDeleteTheme(themeId: string) {
    await fetch(`/api/companies/${companyId}/social/themes/${themeId}`, { method: 'DELETE' });
    await fetchSocialsData();
  }

  async function handleArchiveAllThemes() {
    if (themes.length === 0) return;
    if (!window.confirm('Archive all existing themes? You can create fresh ones right after this.')) return;
    setArchivingThemes(true);
    try {
      await Promise.all(
        themes.map((theme) => fetch(`/api/companies/${companyId}/social/themes/${theme.id}`, { method: 'DELETE' }))
      );
      await fetchSocialsData();
    } finally {
      setArchivingThemes(false);
    }
  }

  const themesById = Object.fromEntries(themes.map((theme) => [theme.id, theme.name]));
  const queueReview = queuePosts.filter((post) => post.status === 'pending_review');
  const queueApproved = queuePosts.filter((post) => post.status === 'approved' || post.status === 'image_ready');

  function getThemeLabel(themeId: string | null): string {
    if (!themeId) return 'Unassigned';
    return themesById[themeId] || 'Archived/removed theme';
  }

  const activePlan = weekPlans[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {([
          ['queue', 'Queue'],
          ['plan', 'Plan'],
          ['themes', 'Themes'],
          ['schedule', 'Schedule'],
          ['calendar', 'Calendar'],
        ] as Array<[SocialSubTab, string]>).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeTab === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => void fetchSocialsData()} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Refreshing</> : 'Refresh'}
          </Button>
        </div>
      </div>

      {activeTab === 'themes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Existing Themes ({themes.length})</p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateThemeForm((prev) => !prev)}>
                {showCreateThemeForm ? 'Close' : '+ New Theme'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => void handleArchiveAllThemes()} disabled={archivingThemes}>
                {archivingThemes ? 'Archiving...' : 'Archive All'}
              </Button>
            </div>
          </div>

          {showCreateThemeForm && (
            <div className="border rounded-lg p-4 bg-white space-y-3">
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Raw instructions for writing:</span> use <span className="font-medium">Caption prompt template</span>.
                </p>
                <p>
                  <span className="font-medium">Raw instructions for visuals:</span> use <span className="font-medium">Image prompt template</span>.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Theme name</p>
                  <Input
                    placeholder="e.g. Audition Wins"
                    value={newTheme.name}
                    onChange={(e) => setNewTheme((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Purpose</p>
                  <Input
                    placeholder="What this theme should achieve"
                    value={newTheme.purpose}
                    onChange={(e) => setNewTheme((prev) => ({ ...prev, purpose: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Caption prompt template</p>
                  <Textarea
                    placeholder="How AI should write this theme's caption (tone, format, CTA)"
                    value={newTheme.caption_prompt}
                    onChange={(e) => setNewTheme((prev) => ({ ...prev, caption_prompt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Image/Video prompt template</p>
                  <Textarea
                    placeholder="How AI should generate visuals for this theme"
                    value={newTheme.image_prompt_template}
                    onChange={(e) => setNewTheme((prev) => ({ ...prev, image_prompt_template: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Priority (1-10)</p>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={newTheme.priority}
                    onChange={(e) => setNewTheme((prev) => ({ ...prev, priority: Number(e.target.value) || 1 }))}
                    className="w-24"
                  />
                </div>
                <Button onClick={() => void handleCreateTheme()} disabled={creatingTheme}>
                  {creatingTheme ? 'Creating...' : 'Create Theme'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {themes.length === 0 ? (
              <div className="border rounded-lg p-4 bg-white text-sm text-gray-500">No themes yet. Click + New Theme.</div>
            ) : themes.map((theme) => {
              const inventory = dataItems.filter((item) => item.theme_id === theme.id && item.status === 'classified').length;
              return (
                <div key={theme.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{theme.name}</p>
                      <p className="text-xs text-gray-500">{theme.purpose || 'No purpose set'}</p>
                    </div>
                    <div className="text-xs text-gray-500">Priority {theme.priority} · Ready ideas {inventory}</div>
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="ghost" onClick={() => void handleDeleteTheme(theme.id)}>
                      Archive
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2"
                      onClick={() => void handleGenerateOneDraft(theme.id)}
                      disabled={inventory === 0 || generatingDraftThemeId === theme.id}
                    >
                      {generatingDraftThemeId === theme.id ? 'Generating...' : 'Generate 1 Draft'}
                    </Button>
                  </div>
                  <div className="mt-3 border-t pt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700">Add content notes to this theme</p>
                    <Textarea
                      rows={3}
                      placeholder="Paste content notes here. One idea per line (wins, updates, outcomes, moments)."
                      value={themeDataDrafts[theme.id] || ''}
                      onChange={(e) =>
                        setThemeDataDrafts((prev) => ({
                          ...prev,
                          [theme.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => void handleAddDataToTheme(theme.id)}
                      disabled={addingDataThemeId === theme.id}
                    >
                      {addingDataThemeId === theme.id ? 'Adding...' : 'Add Notes'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Company-level posting cadence preset</p>
          <div className="flex flex-wrap gap-2">
            {schedulePresetOptions.map((option) => (
              <Button
                key={option.id}
                variant={schedule?.preset === option.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => void handleSchedulePresetChange(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Timezone: <span className="font-medium">{schedule?.timezone || 'America/New_York'}</span>
          </div>
          <div className="border rounded-lg p-3 bg-white">
            <p className="text-sm font-medium mb-2">Slots ({schedule?.slots?.length || 0})</p>
            <div className="space-y-1 text-xs text-gray-600">
              {(schedule?.slots || []).map((slot, idx) => (
                <div key={`${slot.day_of_week}-${slot.hour_utc}-${idx}`}>
                  Day {slot.day_of_week} @ {slot.hour_utc}:00 UTC {slot.theme_id ? `(Pinned theme ${slot.theme_id.slice(0, 8)}...)` : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => void handleReplanWeek(activePlan?.week_start_date)}>
              Re-plan Week
            </Button>
            {activePlan && (
              <Button size="sm" variant="outline" onClick={() => void handleApprovePlan(activePlan.id)}>
                Approve Plan
              </Button>
            )}
          </div>
          {!activePlan ? (
            <p className="text-sm text-gray-500">No week plans yet. Click "Re-plan Week" to generate one.</p>
          ) : (
            <div className="border rounded-lg p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Week of {activePlan.week_start_date}</p>
                <p className="text-xs text-gray-500 uppercase">{activePlan.status}</p>
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto">
                {JSON.stringify(activePlan.planner_summary || {}, null, 2)}
              </pre>
              <Button size="sm" variant="outline" onClick={() => void loadPlanPosts(activePlan.id)}>
                Load Slot Plan
              </Button>
              <div className="grid gap-2 md:grid-cols-2">
                {planPosts.map((post) => (
                  <div key={post.id} className="border rounded p-2 bg-gray-50">
                    <p className="text-xs text-gray-500">{new Date(post.scheduled_for).toLocaleString()}</p>
                    <p className="text-sm">Status: {post.status}</p>
                    <p className="text-xs text-gray-500">Theme: {post.theme_id || 'unassigned'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-blue-50 p-3 text-sm text-blue-900">
            Generate flow: <span className="font-medium">draft caption</span> {'->'} <span className="font-medium">generate post (video/image)</span> {'->'}
            {' '}<span className="font-medium">asset ready</span> {'->'} publish at scheduled time.
          </div>
          <p className="text-xs text-gray-500">
            In <span className="font-medium">Needs Review</span>, "Generate Post" immediately starts media generation.
            Approved queue below is mainly for progress + retry if needed.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Needs Review ({queueReview.length})</p>
            {queueReview.length === 0 ? (
              <p className="text-sm text-gray-500">No posts awaiting caption review.</p>
            ) : (
              queueReview.map((post) => (
                <div key={post.id} className="border rounded-lg p-3 bg-white space-y-2">
                  <p className="text-xs text-gray-500">
                    {new Date(post.scheduled_for).toLocaleString()} · Theme: {getThemeLabel(post.theme_id)}
                  </p>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 mb-1">Preview caption</p>
                    <p className="text-sm">{post.caption || '(No caption yet)'}</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => void handleApproveAndGenerate(post.id, 'video')}
                    >
                      Generate Post (Video)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleApproveAndGenerate(post.id, 'image')}
                    >
                      Generate Post (Image)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await fetch(`/api/companies/${companyId}/social/posts/${post.id}/regenerate`, { method: 'POST' });
                        await fetchSocialsData();
                      }}
                    >
                      Regenerate Caption
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await fetch(`/api/companies/${companyId}/social/posts/${post.id}/cancel`, { method: 'POST' });
                        await fetchSocialsData();
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Approved / Ready Queue ({queueApproved.length})</p>
            {queueApproved.length === 0 ? (
              <p className="text-sm text-gray-500">No approved items in queue yet.</p>
            ) : (
              queueApproved.map((post) => (
                <div key={post.id} className="border rounded-lg p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(post.scheduled_for).toLocaleString()}</span>
                    <span className="uppercase">{post.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Asset status: <span className="font-medium">{post.image_status || 'not_generated'}</span>
                  </div>
                  {post.image_url ? (
                    post.image_url.endsWith('.mp4') ? (
                      <video
                        src={post.image_url}
                        controls
                        muted
                        playsInline
                        className="w-full max-h-56 rounded-md border bg-black object-contain"
                      />
                    ) : (
                      <img src={post.image_url} alt="Post preview" className="w-full max-h-56 rounded-md border object-cover" />
                    )
                  ) : (
                    <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-600">
                      Asset preview will appear here after generation.
                    </div>
                  )}
                  <p className="text-sm">{post.caption || '(No caption yet)'}</p>
                  {post.error && <p className="text-xs text-red-600">{post.error}</p>}
                  <div className="flex gap-2">
                    {post.status === 'approved' && post.image_status === 'not_generated' && (
                      <p className="text-xs text-gray-500">Waiting for generation trigger from Needs Review flow.</p>
                    )}
                    {post.status === 'approved' && post.image_status === 'generating' && (
                      <Button size="sm" variant="outline" disabled>
                        Generating...
                      </Button>
                    )}
                    {post.status === 'approved' && post.image_status === 'failed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await fetch(`/api/companies/${companyId}/social/posts/${post.id}/generate-image`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ mode: 'video' }),
                            });
                            await fetchSocialsData();
                          }}
                        >
                          Retry Video
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await fetch(`/api/companies/${companyId}/social/posts/${post.id}/generate-image`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ mode: 'image' }),
                            });
                            await fetchSocialsData();
                          }}
                        >
                          Retry Image
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-2">
          {[...queuePosts, ...planPosts]
            .sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for))
            .slice(0, 30)
            .map((post) => (
              <div key={post.id} className="border rounded p-2 bg-white flex items-center justify-between">
                <span className="text-sm">{new Date(post.scheduled_for).toLocaleString()}</span>
                <span className="text-xs text-gray-500 uppercase">{post.status}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
