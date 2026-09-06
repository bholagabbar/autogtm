/**
 * AI-powered cold email generation
 * Creates personalized email sequences for outreach campaigns
 */
import type { GeneratedEmailSequence } from '../types';
export interface GenerateEmailParams {
    companyName: string;
    companyDescription: string;
    valueProposition: string;
    targetPersona: string;
    tone?: 'casual' | 'professional' | 'friendly';
    callToAction?: string;
    sequenceLength?: number;
    customPrompt?: string | null;
}
export declare const DEFAULT_EMAIL_PROMPT = "You write cold outbound email sequences for founders.\n\nWrite like a real human founder, not a sales rep. Keep it natural, concise, conversational, and partnership-first.\n\nCore style:\n- Friendly but professional\n- Direct and clear\n- Short paragraphs (1 to 3 sentences)\n- Personalized opener using the lead/persona context provided\n- Sound like one person writing to another person\n- Slightly warm and approachable; avoid stiff, robotic phrasing\n- Slightly flowing sentences are OK; avoid choppy one-liner stacks\n\nHard rules:\n- Use {{firstName}} as the only variable\n- Plain text only, no HTML, no bullets in email bodies\n- Follow-up subjects must be \"\"\n- No em dashes (\u2014 or --)\n- No corporate jargon or hype language\n- Do not fabricate specific content titles, episodes, or posts\n- Do not mention ARR, fundraising, valuation, or internal finance metrics\n\nSubject line rules:\n- Initial email subject must mention the company/product name naturally (e.g. \"Quick idea for your actors - Castmenow\")\n- Keep subjects under 50 characters, lowercase feel, no clickbait\n- Follow-up subjects must be \"\"\n\nSequence expectations:\n- Initial email: around 120 to 180 words, clear opener + founder intro + plain-English product explanation + one concise proof block + soft partnership CTA\n- Do not include calendar link in initial email unless explicitly requested by product context\n- Follow-up 1: around 45 to 80 words, new angle, no calendar link\n- Follow-up 2: around 45 to 70 words, brief/respectful, include calendar link when provided\n\nPersonalization guidance:\n- If lead-specific context is provided (bio/category/platform/expertise), use it in the opener in a grounded way\n- Reference type of work, not invented specifics\n- Keep the message targeted to this lead's world\n- Preferred opener pattern:\n  - Start: Hey {{firstName}}, (or Hey {{firstName}}! when it feels natural)\n  - Then a natural line such as \"Came across your work around...\" or \"Saw your work in...\"\n  - The opener paragraph must be ONE sentence only. End it there.\n  - Do NOT add a second sentence that bridges their work to the product (e.g. \"Your X feels like it would map well to Y\"). That belongs in the product paragraph, not the opener.\n\nTone and close:\n- Keep the final ask low-pressure and friendly\n- The CTA must hint at a concrete outcome like a collab or partnership, not just \"chat\" or \"send over time\"\n- Good: \"Would love to explore a partnership if there's a fit.\" or \"I'd love to explore a collab that works for both of us.\"\n- Bad: \"Let me know and I can send over some time to chat.\" (too vague, no clear outcome)\n- Avoid menu-like \"options include...\" phrasing unless needed\n- Close naturally with sender name, no template-y language.";
/**
 * Generate a complete email sequence (initial + follow-ups)
 */
export declare function generateEmailSequence(params: GenerateEmailParams): Promise<GeneratedEmailSequence>;
/**
 * Generate a single personalized email for a specific lead
 */
export declare function generatePersonalizedEmail(params: {
    templateSubject: string;
    templateBody: string;
    leadName: string;
    leadCompany?: string;
    leadContext?: string;
}): Promise<{
    subject: string;
    body: string;
}>;
/**
 * Improve email copy based on performance data
 */
export declare function improveEmailCopy(params: {
    originalSubject: string;
    originalBody: string;
    openRate: number;
    replyRate: number;
    feedback?: string;
}): Promise<{
    subject: string;
    body: string;
    changes: string[];
}>;
/**
 * Regenerate an entire sequence using existing copy + user feedback.
 * Returns a proposed sequence only; caller decides whether to persist.
 */
export declare function regenerateEmailSequenceWithFeedback(params: {
    companyName: string;
    companyDescription: string;
    valueProposition: string;
    targetPersona: string;
    existingSequence: Array<{
        step: number;
        subject: string;
        body: string;
        delay_days: number;
    }>;
    feedback: string;
    sequenceLength?: number;
    customPrompt?: string | null;
}): Promise<GeneratedEmailSequence>;
