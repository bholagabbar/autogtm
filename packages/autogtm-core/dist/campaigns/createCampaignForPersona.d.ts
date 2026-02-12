/**
 * Creates a new Instantly campaign for a given persona,
 * generates AI email copy, saves everything to DB, and activates it.
 */
import type { Company, Campaign } from '../types';
export interface CreateCampaignForPersonaParams {
    company: Pick<Company, 'id' | 'name' | 'description' | 'target_audience'> & {
        sending_emails?: string[];
        default_sequence_length?: number;
        email_prompt?: string | null;
    };
    suggestedName: string;
    suggestedPersona: string;
}
export declare function createCampaignForPersona(params: CreateCampaignForPersonaParams): Promise<Campaign>;
