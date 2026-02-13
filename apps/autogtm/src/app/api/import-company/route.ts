import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [{ type: 'web_search_preview' as const }],
      input: `Visit and analyze the company website at ${url}.

Based on what you find, return a JSON object with exactly these fields:
- "name": The company name
- "website": The canonical website URL (use "${url}" if unclear)
- "description": A 2-3 sentence description of what the company does, written in first person plural ("We..."). Be specific about their product/service, value proposition, and industry.
- "target_audience": A 1-2 sentence description of their ideal target customer/audience based on the company's offerings.

Return ONLY the raw JSON object. No markdown, no code fences, no explanation.`,
    });

    const text = response.output_text;

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      name: parsed.name || '',
      website: parsed.website || url,
      description: parsed.description || '',
      target_audience: parsed.target_audience || '',
    });
  } catch (error) {
    console.error('Error importing company:', error);
    return NextResponse.json(
      { error: 'Failed to import company data' },
      { status: 500 }
    );
  }
}
