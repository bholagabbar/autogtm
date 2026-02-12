/**
 * Quick AI-powered email extractor from arbitrary Exa enrichment data
 * Uses a fast model to parse unstructured enrichment objects and pull out an email
 */
import OpenAI from 'openai';
import { z } from 'zod';
const ResultSchema = z.object({
    email: z.string().email().nullable().catch(null),
});
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
        throw new Error('OPENAI_API_KEY is required');
    return new OpenAI({ apiKey });
}
export async function extractEmailFromEnrichmentData(enrichmentData) {
    if (!enrichmentData)
        return null;
    const dataStr = JSON.stringify(enrichmentData);
    // Quick check - if no @ symbol anywhere, no email to find
    if (!dataStr.includes('@'))
        return null;
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [
            {
                role: 'system',
                content: 'Extract the most relevant contact email address from this data. Return JSON: { "email": "found@email.com" } or { "email": null } if none found. Pick personal/business emails over generic support emails when possible.',
            },
            { role: 'user', content: dataStr.slice(0, 3000) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
    });
    const content = response.choices[0]?.message?.content;
    if (!content)
        return null;
    try {
        const parsed = ResultSchema.parse(JSON.parse(content));
        return parsed.email;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=extractEmail.js.map