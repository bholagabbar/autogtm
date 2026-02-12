'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Brain, Mail, BarChart3, Zap, Clock, Target, Send } from 'lucide-react';

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setContactForm({ name: '', email: '', message: '' });
    } catch {
      setError('Something went wrong. Try emailing us directly at shreyans@cmnlabs.co');
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
            <Link
              href="/login"
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg"
            >
              Get Started
            </Link>
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
            Describe your target audience in plain English. autogtm finds leads, scores them with AI, writes personalized emails, and sends campaigns &mdash; every day, automatically.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-base"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
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
                title: 'Define your audience',
                desc: 'Write targeting instructions in plain English. Update them anytime and new queries are generated automatically.',
              },
              {
                step: '02',
                icon: Search,
                title: 'AI discovers leads',
                desc: 'Exa.ai websets search the internet for people matching your description. Dozens of new leads every day.',
              },
              {
                step: '03',
                icon: Brain,
                title: 'AI enriches & scores',
                desc: 'Every lead gets a bio, social profiles, audience size, expertise tags, and a 1-10 fit score with reasoning.',
              },
              {
                step: '04',
                icon: Mail,
                title: 'Campaigns run automatically',
                desc: 'AI writes personalized email sequences. High-fit leads are routed to Instantly.ai campaigns and sent.',
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
                desc: 'Queries run at 8:30am, leads are enriched on arrival, analytics sync hourly, digest sent at 6pm.',
              },
              {
                icon: Brain,
                title: 'AI-written email copy',
                desc: 'Personalized multi-step sequences generated per campaign persona. No templates, no guesswork.',
              },
              {
                icon: Zap,
                title: 'Auto-add mode',
                desc: 'Set a fit score threshold and high-quality leads are automatically added to campaigns. Zero manual review.',
              },
              {
                icon: Search,
                title: 'Exploration mode',
                desc: 'When no new instructions exist, AI generates creative queries to keep your pipeline full.',
              },
              {
                icon: BarChart3,
                title: 'Analytics & digest',
                desc: 'Opens, replies, and bounces synced from Instantly. Daily summary email with everything that happened.',
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

      {/* Integrations */}
      <section className="py-16 px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">
            Powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {['Exa.ai', 'Instantly.ai', 'OpenAI', 'Supabase', 'Inngest', 'Resend'].map((name) => (
              <span key={name} className="text-base font-semibold text-gray-400">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-950">Get in touch</h2>
            <p className="mt-3 text-gray-500">
              Want to learn more, request a demo, or discuss a custom deployment? Drop us a line.
            </p>
          </div>
          {sent ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Message sent</h3>
              <p className="text-sm text-gray-500">We&apos;ll get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="bg-white border border-gray-200 rounded-xl p-8 space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Tell us about your use case..."
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-0">
            <span className="font-black text-lg tracking-tight text-gray-900">auto</span>
            <span className="font-black text-lg tracking-tight text-white bg-indigo-600 px-1.5 py-0.5 rounded-md ml-0.5">gtm</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} CMN Labs. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
