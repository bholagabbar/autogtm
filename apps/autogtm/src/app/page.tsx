'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Brain, Mail, BarChart3, Zap, Clock, Target, X } from 'lucide-react';

export default function LandingPage() {
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
      setContactForm({ name: '', email: '', message: '' });
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-0">
            <span className="font-black text-xl tracking-tight text-gray-900">auto</span>
            <span className="font-black text-xl tracking-tight text-white bg-indigo-600 px-1.5 py-0.5 rounded-md ml-0.5">gtm</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <button
              onClick={() => { setShowContact(true); setSent(false); }}
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg"
            >
              Request invite
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="h-3.5 w-3.5" />
            Open-source go-to-market engine
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-950 leading-[1.08]">
            Cold outbound
            <br />
            <span className="text-indigo-600">on autopilot</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Describe your target audience in plain English. autogtm discovers leads daily, enriches them with AI, creates tailored email campaigns, and sends via Instantly. System on, autopilot on, you sleep.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => { setShowContact(true); setSent(false); }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-base"
            >
              Request invite
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3 transition-colors text-base"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Pipeline Visual */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-950 rounded-2xl p-8 sm:p-12 overflow-hidden">
            <div className="font-mono text-sm text-gray-400 mb-4">$ autogtm pipeline</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-900 rounded-xl p-5">
                <div className="text-indigo-400 font-mono text-xs mb-3 uppercase tracking-wider">Input</div>
                <p className="text-white text-sm font-medium leading-snug">&quot;Find acting coaches with 5-20k followers&quot;</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <div className="text-emerald-400 font-mono text-xs mb-3 uppercase tracking-wider">Discover</div>
                <p className="text-white text-sm font-medium">47 leads found via Exa.ai websets</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <div className="text-amber-400 font-mono text-xs mb-3 uppercase tracking-wider">Enrich</div>
                <p className="text-white text-sm font-medium">AI scores, bios, social data added</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <div className="text-rose-400 font-mono text-xs mb-3 uppercase tracking-wider">Send</div>
                <p className="text-white text-sm font-medium">Personalized campaigns via Instantly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-950">
              How it works
            </h2>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              From natural language to sent emails in four steps. All automated, every day.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {[
              {
                step: '01',
                icon: Target,
                title: 'You add context',
                desc: 'Tell the AI who you want to reach in plain English. "Find podcast hosts in the acting space" or "Look for fitness coaches on TikTok with 10k+ followers."',
              },
              {
                step: '02',
                icon: Search,
                title: 'AI generates searches and finds leads',
                desc: 'Every morning at 8:30 AM, AI turns your instructions into targeted searches. At 9 AM, those searches run and new leads are discovered automatically.',
              },
              {
                step: '03',
                icon: Brain,
                title: 'AI enriches, scores, and matches',
                desc: 'Each lead is enriched with a bio, social links, audience size, and a 1-10 fit score. AI then picks or creates the right campaign with a personalized email sequence.',
              },
              {
                step: '04',
                icon: Mail,
                title: 'You approve, or go full autopilot',
                desc: 'Review leads and click "Add to Campaign", or turn Autopilot on and high-fit leads go straight into Instantly campaigns automatically.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs font-mono text-indigo-600 mb-1">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-950">
              Built for serious outbound
            </h2>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              Everything you need to run cold email at scale, without the manual work.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Runs daily on schedule',
                desc: '8:30 AM: generate queries. 9 AM: run searches and enrich leads. Hourly: sync campaign analytics. 6 PM: daily digest email.',
              },
              {
                icon: Brain,
                title: 'AI-written email sequences',
                desc: 'Personalized multi-step sequences generated per campaign persona. Founder-led tone, no templates, no generic copy.',
              },
              {
                icon: Zap,
                title: 'System ON/OFF + Autopilot',
                desc: 'Master switch controls the entire pipeline. Autopilot auto-adds high-fit leads to campaigns. Both toggles with confirmation dialogs.',
              },
              {
                icon: Search,
                title: 'Exploration mode',
                desc: 'When no new instructions exist, AI generates creative queries to keep discovering fresh leads for your pipeline.',
              },
              {
                icon: BarChart3,
                title: 'Analytics & digest',
                desc: 'Opens, replies, and bounces synced from Instantly. Daily summary email with leads found and campaign performance.',
              },
              {
                icon: Target,
                title: 'Multi-company',
                desc: 'Manage multiple company profiles with different targeting, personas, and campaigns from one dashboard.',
              },
            ].map((feat, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                <feat.icon className="h-5 w-5 text-indigo-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950">
            Why we built this
          </h2>
          <p className="mt-5 text-gray-500 leading-relaxed">
            Solo founders and small teams need outbound that runs without babysitting. Finding leads, enriching them, writing copy, managing campaigns across tools, it is painful and slow when done manually. autogtm connects Exa, OpenAI, and Instantly into one pipeline that runs every day on its own, so you wake up to new leads already in campaigns.
          </p>
          <div className="mt-8">
            <button
              onClick={() => { setShowContact(true); setSent(false); }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Request invite
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowContact(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
            {sent ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-gray-900">Request received. We&#39;ll be in touch.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Request an invite</h3>
                <p className="text-sm text-gray-500">autogtm is currently invite-only. Tell us a bit about yourself and we&#39;ll send you a code.</p>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Name"
                />
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Email"
                />
                <textarea
                  rows={2}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="What are you working on? (optional)"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Request invite'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-0">
            <span className="font-black text-lg tracking-tight text-gray-900">auto</span>
            <span className="font-black text-lg tracking-tight text-white bg-indigo-600 px-1.5 py-0.5 rounded-md ml-0.5">gtm</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setShowContact(true); setSent(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Request invite
            </button>
            <span className="text-gray-200">|</span>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} autogtm
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
