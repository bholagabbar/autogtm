/**
 * AI-powered lead enrichment using OpenAI with web search
 * Takes raw lead data and company context, returns structured persona
 */

import OpenAI from 'openai';
import { z } from 'zod';
import type { EnrichedLeadData } from '../types';

const EnrichedLeadSchema = z.object({
  category: z.string().catch('other'),
  full_name: z.string().catch('Unknown'),
  title: z.string().catch(''),
  bio: z.string().catch(''),
  expertise: z.array(z.string()).catch([]),
  social_links: z.record(z.unknown()).catch({}),
  total_audience: z.number().catch(0),
  content_types: z.array(z.string()).catch([]),
  promotion_fit_score: z.number().catch(5),
  promotion_fit_reason: z.string().catch(''),
  email: z.string().nullable().catch(null),
});

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');
  return new OpenAI({ apiKey });
}

export async function enrichLead(
  leadData: Record<string, unknown>,
  companyContext: { name: string; description: string; targetAudience: string }
): Promise<EnrichedLeadData> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are a lead enrichment specialist. You'll receive raw data about a lead discovered from web searches, plus context about the company reaching out to them.

Parse everything you're given, then use web search to fill in any gaps.

Your task:
1. Figure out who this lead is from the raw data
2. Find their contact email (check the raw data first, then search their website/socials)
3. Find social media profiles and audience sizes
4. Understand what content they create
5. Score how good a fit they are for the company

Be thorough but concise. Use web search for anything not in the raw data.`;

  const userPrompt = `Enrich this lead:

**Raw Lead Data:**
${JSON.stringify(leadData, null, 2).slice(0, 5000)}

**Company Context (who wants to reach them):**
- Company: ${companyContext.name}
- What they do: ${companyContext.description}
- Target audience: ${companyContext.targetAudience}

Return JSON with these fields:
1. **category**: What they are (influencer, coach, blog, agency, podcast, or anything else that fits)
2. **full_name**: Their actual name
3. **title**: Professional title (e.g., "Acting Coach", "Podcast Host")
4. **bio**: 2-3 sentence summary
5. **expertise**: Array of expertise areas
6. **social_links**: Object with social profile URLs (use null for missing ones)
7. **total_audience**: Total followers/subscribers across platforms (number)
8. **content_types**: Array of content they create
9. **promotion_fit_score**: 1-10 fit score for ${companyContext.name}
10. **promotion_fit_reason**: Brief explanation
11. **email**: Contact email address. Check the raw data first - it may already be there. If not, search for it. Return null only if truly unfindable.

Return ONLY valid JSON.`;

  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    tools: [{ type: 'web_search_preview' }],
    input: `${systemPrompt}\n\n${userPrompt}`,
  });

  const responseText = response.output_text || '';

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return EnrichedLeadSchema.parse(parsed) as EnrichedLeadData;
  } catch (error) {
    console.error('Failed to parse enrichment response:', responseText);
    throw new Error(`Failed to parse lead enrichment: ${error}`);
  }
}
