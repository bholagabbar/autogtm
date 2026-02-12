'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Sparkles, Check } from 'lucide-react';

interface GeneratedQuery {
  query: string;
  criteria: string[];
  rationale: string;
}

export function CompanySetup() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'queries' | 'saving'>('form');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    targetAudience: '',
  });

  const [generatedQueries, setGeneratedQueries] = useState<GeneratedQuery[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<Set<number>>(new Set());

  const handleGenerateQueries = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/generate-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate queries');
      }

      const data = await response.json();
      setGeneratedQueries(data.queries);
      setSelectedQueries(new Set(data.queries.map((_: any, i: number) => i)));
      setStep('queries');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate queries. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setStep('saving');
    setLoading(true);

    try {
      const selectedQueryData = generatedQueries.filter((_, i) => selectedQueries.has(i));
      
      const response = await fetch('/api/save-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData,
          queries: selectedQueryData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const data = await response.json();
      
      // Set the newly created company as selected
      if (data.company?.id) {
        localStorage.setItem('autogtm_selected_company', data.company.id);
      }

      toast({
        title: 'Success',
        description: 'Company and queries saved successfully!',
      });

      router.push('/app');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save. Please try again.',
      });
      setStep('queries');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuery = (index: number) => {
    const newSelected = new Set(selectedQueries);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQueries(newSelected);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/app" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {step === 'form' && (
          <div className="bg-white rounded-xl border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Company Setup</h2>
              <p className="text-sm text-gray-500">
                Tell us about your company so we can generate smart search queries
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleGenerateQueries} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    placeholder="Acme Inc"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://acme.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">What does your company do?</Label>
                  <Textarea
                    id="description"
                    placeholder="We help actors get more auditions by automating their submissions to casting calls..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Who is your target audience?</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Actors, content creators, and performers who are looking for more audition opportunities..."
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Queries...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Search Queries
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {step === 'queries' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Review Generated Queries</h2>
                <p className="text-sm text-gray-500">
                  Select the queries you want to use for lead discovery
                </p>
              </div>
              <div className="p-6 space-y-4">
                {generatedQueries.map((query, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedQueries.has(index)
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleQuery(index)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">{query.query}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {query.criteria.map((criterion, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                            >
                              {criterion}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">{query.rationale}</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedQueries.has(index)
                            ? 'bg-gray-900 border-gray-900'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedQueries.has(index) && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={selectedQueries.size === 0 || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${selectedQueries.size} Queries`
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-lg font-medium text-gray-900">Setting up your company...</p>
            <p className="text-gray-500">This will just take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
