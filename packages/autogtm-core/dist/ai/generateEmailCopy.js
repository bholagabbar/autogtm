/**
 * AI-powered cold email generation
 * Creates personalized email sequences for outreach campaigns
 */
import OpenAI from 'openai';
import { z } from 'zod';
const EmailSequenceSchema = z.object({
    initial: z.object({
        subject: z.string(),
        body: z.string(),
    }),
    followUp1: z.object({
        subject: z.string(),
        body: z.string(),
        delayDays: z.number(),
    }),
    followUp2: z.object({
        subject: z.string(),
        body: z.string(),
        delayDays: z.number(),
    }).optional(),
});
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required');
    }
    return new OpenAI({ apiKey });
}
export const DEFAULT_EMAIL_PROMPT = `You write cold outreach emails on behalf of a company founder. Your tone is confident, friendly, and human.

STRUCTURE FOR THE SEQUENCE:
- INITIAL EMAIL: One light, RELEVANT sentence about the persona (use the persona context, not generic flattery). Then intro yourself and the product. Drop a real stat or proof point if available. End with a soft pull CTA like "Mind if I send over some details?" or "Would love to give you access and chat about it."
- FOLLOW-UP 1 (+3 days): Different angle or value prop. Short. End with "Open to a quick chat?" or similar.
- FOLLOW-UP 2 (+4 days): Brief and final. Last chance nudge.

FORMATTING:
- {{first_name}} is the ONLY personalization variable.
- Short paragraphs. 2-3 sentences max per paragraph. Separate with line breaks.
- Sign off with the sender's first name. Never "[Your Name]".
- Initial email: 120-150 words. Follow-ups: 50-80 words.
- Follow-up subjects: empty string "" (they thread under the original).
- Plain text only. No HTML. No em dashes (use commas or periods). No bullet points.

NEVER DO THESE:
- "I hope this finds you well", "I'm reaching out from", "I represent"
- Em dashes, exclamation marks
- "exciting", "thrilled", "empower", "streamline", "leverage"
- "{{company_name}}" variable (doesn't exist)
- Generic flattery that doesn't match the persona
- Long run-on paragraphs`;
/**
 * Generate a complete email sequence (initial + follow-ups)
 */
export async function generateEmailSequence(params) {
    const openai = getOpenAIClient();
    const cta = params.callToAction || 'a quick chat';
    const numFollowUps = Math.min(Math.max((params.sequenceLength ?? 2) - 1, 0), 2);
    const basePrompt = params.customPrompt || DEFAULT_EMAIL_PROMPT;
    const calendarNote = `\nIMPORTANT: The LAST follow-up email in the sequence MUST include the calendar link. If there's only 1 follow-up, that follow-up must have the calendar link.`;
    const jsonInstruction = numFollowUps === 0
        ? `\n\nReturn ONLY the initial email as JSON:\n{ "initial": { "subject": "...", "body": "..." } }`
        : numFollowUps === 1
            ? `${calendarNote}\n\nReturn JSON with initial + 1 follow-up (include calendar link in followUp1):\n{ "initial": { "subject": "...", "body": "..." }, "followUp1": { "subject": "", "body": "...", "delayDays": 3 } }`
            : `${calendarNote}\n\nReturn JSON with initial + 2 follow-ups (include calendar link in followUp2):\n{ "initial": { "subject": "...", "body": "..." }, "followUp1": { "subject": "", "body": "...", "delayDays": 3 }, "followUp2": { "subject": "", "body": "...", "delayDays": 4 } }`;
    const systemPrompt = basePrompt + jsonInstruction;
    const userPrompt = `Write a ${numFollowUps + 1}-email outreach sequence.

Sender: ${params.companyName}
Product: ${params.companyDescription}
Value: ${params.valueProposition}
Persona: ${params.targetPersona}
CTA: ${cta}

Remember: the opener must be specifically relevant to this persona type. Not generic.`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
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
    return EmailSequenceSchema.parse(JSON.parse(content));
}
/**
 * Generate a single personalized email for a specific lead
 */
export async function generatePersonalizedEmail(params) {
    const openai = getOpenAIClient();
    const systemPrompt = `You are personalizing a cold email template for a specific lead.
Keep the core message but adapt it to feel more personal and relevant.
Only make subtle changes - don't rewrite the entire email.
Return JSON: { "subject": "...", "body": "..." }`;
    const userPrompt = `Template Subject: ${params.templateSubject}
Template Body: ${params.templateBody}

Lead Name: ${params.leadName}
Lead Company: ${params.leadCompany || 'Unknown'}
Lead Context: ${params.leadContext || 'No additional context'}

Personalize this email while keeping the core message intact.`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No response from OpenAI');
    }
    return JSON.parse(content);
}
/**
 * Improve email copy based on performance data
 */
export async function improveEmailCopy(params) {
    const openai = getOpenAIClient();
    const systemPrompt = `You are a cold email optimization expert.
Based on the performance data, suggest improvements to the email.

Return JSON:
{
  "subject": "improved subject",
  "body": "improved body",
  "changes": ["change 1", "change 2"]
}`;
    const userPrompt = `Original Subject: ${params.originalSubject}
Original Body: ${params.originalBody}

Performance:
- Open Rate: ${(params.openRate * 100).toFixed(1)}%
- Reply Rate: ${(params.replyRate * 100).toFixed(1)}%

${params.feedback ? `Feedback: ${params.feedback}` : ''}

${params.openRate < 0.3 ? 'Focus on improving the subject line to boost opens.' : ''}
${params.replyRate < 0.05 ? 'Focus on making the CTA clearer and the value prop stronger.' : ''}

Suggest improvements.`;
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
    return JSON.parse(content);
}
//# sourceMappingURL=generateEmailCopy.js.map