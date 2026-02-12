/**
 * AI Agent for daily query generation
 * Two modes:
 * 1. FOCUSED: Generate query specifically for a new instruction
 * 2. EXPLORATION: No new instructions, creatively explore new angles
 */
import OpenAI from 'openai';
import { z } from 'zod';
const SingleQuerySchema = z.object({
    query: z.string(),
    criteria: z.array(z.string()),
    rationale: z.string(),
});
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required');
    }
    return new OpenAI({ apiKey });
}
/**
 * Generate a query SPECIFICALLY for a given instruction
 * Uses web search to research the company and target audience
 */
export async function generateFocusedQuery(params) {
    const openai = getOpenAIClient();
    const systemPrompt = `You are an AI agent that generates search queries for finding potential leads using the Exa Websets API.

You have access to web search. USE IT to:
1. Research the company's website to understand their product/service
2. Look up the target audience segment mentioned in the instruction
3. Find examples of influencers/creators in that niche to understand naming patterns

The user has given you a SPECIFIC instruction. Generate ONE highly targeted query that DIRECTLY addresses this instruction.

The query should find people who:
- Have social media presence (TikTok, Instagram, YouTube, Twitter, LinkedIn)
- Have contact information available
- Would be good targets for cold outreach
- MOST IMPORTANTLY: Match the user's specific instruction

After your research, return ONLY valid JSON:
{
  "query": "the search query string",
  "criteria": ["criterion 1", "criterion 2", "criterion 3"],
  "rationale": "how this query addresses the user's instruction and what you learned from research"
}`;
    const userPrompt = `**Company Profile:**
Name: ${params.company.name}
Website: ${params.company.website}
Description: ${params.company.description}
Target Audience: ${params.company.targetAudience}

**USER'S SPECIFIC INSTRUCTION:**
"${params.instruction}"

First, research the company website and the target segment. Then generate ONE query that DIRECTLY targets what the user is asking for. Be specific and precise.`;
    const response = await openai.responses.create({
        model: 'gpt-4.1-mini',
        tools: [{ type: 'web_search_preview' }],
        input: `${systemPrompt}\n\n${userPrompt}`,
    });
    const responseText = response.output_text || '';
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in response');
    }
    const parsed = SingleQuerySchema.parse(JSON.parse(jsonMatch[0]));
    return {
        query: parsed.query,
        criteria: parsed.criteria,
        rationale: parsed.rationale,
    };
}
/**
 * Generate a creative exploration query when no new instructions exist
 * Uses web search to discover new angles and segments
 */
export async function generateExplorationQuery(params) {
    const openai = getOpenAIClient();
    const pastQueriesContext = params.pastQueries.length > 0
        ? params.pastQueries.map((q, i) => `${i + 1}. "${q.query}" (found ${q.leads_found ?? '?'} leads)`).join('\n')
        : 'No past queries yet - this is the first one!';
    const systemPrompt = `You are an AI agent that generates ONE search query per day for finding potential leads using the Exa Websets API.

You have access to web search. USE IT to:
1. Research the company's website and understand their product
2. Search for trending creators/influencers in adjacent niches
3. Discover untapped platforms or audience segments they might not have considered
4. Look at what types of content creators are gaining traction in this space

Since the user has no new specific instructions, your job is to CREATIVELY EXPLORE new lead segments based on your research.

Look at past queries and find a COMPLETELY DIFFERENT angle:
- Different platform (TikTok, YouTube, Instagram, Twitter, LinkedIn, podcasts, blogs)
- Different audience segment (beginners, pros, niche specialists)
- Different content type (coaches, influencers, educators, reviewers)
- Different geographic or demographic angle

The query should find people who:
- Have social media presence
- Have contact information available
- Would be good targets for cold outreach
- Are DIFFERENT from what past queries targeted

After your research, return ONLY valid JSON:
{
  "query": "the search query string",
  "criteria": ["criterion 1", "criterion 2", "criterion 3"],
  "rationale": "what new segment this explores and what you discovered from research"
}`;
    const userPrompt = `**Company Profile:**
Name: ${params.company.name}
Website: ${params.company.website}
Description: ${params.company.description}
Target Audience: ${params.company.targetAudience}
${params.company.agentNotes ? `Notes: ${params.company.agentNotes}` : ''}

**Past Queries (DO NOT REPEAT - find something NEW):**
${pastQueriesContext}

Research the company and the space, then generate ONE query that explores a COMPLETELY DIFFERENT angle. Be creative and specific.`;
    const response = await openai.responses.create({
        model: 'gpt-4.1-mini',
        tools: [{ type: 'web_search_preview' }],
        input: `${systemPrompt}\n\n${userPrompt}`,
    });
    const responseText = response.output_text || '';
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in response');
    }
    const parsed = SingleQuerySchema.parse(JSON.parse(jsonMatch[0]));
    return {
        query: parsed.query,
        criteria: parsed.criteria,
        rationale: parsed.rationale,
    };
}
/** @deprecated Use generateFocusedQuery or generateExplorationQuery instead */
export async function generateDailyQuery(params) {
    return generateExplorationQuery({
        company: params.company,
        pastQueries: params.pastQueries,
    });
}
//# sourceMappingURL=generateDailyQuery.js.map