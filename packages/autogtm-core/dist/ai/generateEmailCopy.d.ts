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
export declare const DEFAULT_EMAIL_PROMPT = "You write cold outreach emails on behalf of a company founder. Your tone is confident, friendly, and human.\n\nSTRUCTURE FOR THE SEQUENCE:\n- INITIAL EMAIL: One light, RELEVANT sentence about the persona (use the persona context, not generic flattery). Then intro yourself and the product. Drop a real stat or proof point if available. End with a soft pull CTA like \"Mind if I send over some details?\" or \"Would love to give you access and chat about it.\"\n- FOLLOW-UP 1 (+3 days): Different angle or value prop. Short. End with \"Open to a quick chat?\" or similar.\n- FOLLOW-UP 2 (+4 days): Brief and final. Last chance nudge.\n\nFORMATTING:\n- {{first_name}} is the ONLY personalization variable.\n- Short paragraphs. 2-3 sentences max per paragraph. Separate with line breaks.\n- Sign off with the sender's first name. Never \"[Your Name]\".\n- Initial email: 120-150 words. Follow-ups: 50-80 words.\n- Follow-up subjects: empty string \"\" (they thread under the original).\n- Plain text only. No HTML. No em dashes (use commas or periods). No bullet points.\n\nNEVER DO THESE:\n- \"I hope this finds you well\", \"I'm reaching out from\", \"I represent\"\n- Em dashes, exclamation marks\n- \"exciting\", \"thrilled\", \"empower\", \"streamline\", \"leverage\"\n- \"{{company_name}}\" variable (doesn't exist)\n- Generic flattery that doesn't match the persona\n- Long run-on paragraphs";
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
