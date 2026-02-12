/**
 * AI-powered Exa query generation
 * Generates search queries and criteria based on company profile
 */

import OpenAI from 'openai';
import { z } from 'zod';
import type { GeneratedQuery } from '../types';

const QueryResponseSchema = z.object({
  queries: z.array(z.object({
    query: z.string(),
    criteria: z.array(z.string()),
    rationale: z.string(),
  })),
});

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  return new OpenAI({ apiKey });
}

export interface GenerateQueriesParams {
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
  targetAudience: string;
  numberOfQueries?: number;
}

/**
 * Generate Exa search queries based on company profile
 */
export async function generateExaQueries(params: GenerateQueriesParams): Promise<GeneratedQuery[]> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are an expert at generating search queries for finding potential customers and influencers using the Exa Websets API.

Your task is to generate search queries that will help find people who would be great targets for cold outreach based on a company's profile.

The queries should be specific enough to find relevant people but broad enough to get good results. Focus on:
- Social media profiles (TikTok, Instagram, YouTube, LinkedIn)
- Personal websites and portfolios
- Blog posts and articles

For each query, also provide 2-3 criteria that Exa should use to verify results match what we're looking for.

Return your response as JSON with this structure:
{
  "queries": [
    {
      "query": "the search query",
      "criteria": ["criterion 1", "criterion 2"],
      "rationale": "why this query will find good leads"
    }
  ]
}`;

  const userPrompt = `Generate ${params.numberOfQueries || 5} search queries for the following company:

Company Name: ${params.companyName}
Website: ${params.companyWebsite}
Description: ${params.companyDescription}
Target Audience: ${params.targetAudience}

Generate queries that will help find people who:
1. Match the target audience profile
2. Have public contact information or social presence
3. Would benefit from what this company offers

Focus on finding micro-influencers, content creators, and active professionals in the relevant space.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = QueryResponseSchema.parse(JSON.parse(content));
  return parsed.queries as GeneratedQuery[];
}

/**
 * Refine a query based on feedback or results
 */
export async function refineQuery(params: {
  originalQuery: string;
  originalCriteria: string[];
  feedback: string;
  resultsQuality?: 'good' | 'too_broad' | 'too_narrow' | 'off_target';
}): Promise<GeneratedQuery> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are an expert at refining search queries for the Exa Websets API.
Given the original query, criteria, and feedback, generate an improved version.

Return your response as JSON:
{
  "query": "refined query",
  "criteria": ["criterion 1", "criterion 2"],
  "rationale": "what was changed and why"
}`;

  const userPrompt = `Original Query: ${params.originalQuery}
Original Criteria: ${params.originalCriteria.join(', ')}
Feedback: ${params.feedback}
Results Quality: ${params.resultsQuality || 'unknown'}

Please refine this query to get better results.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content) as GeneratedQuery;
}
