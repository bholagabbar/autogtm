/**
 * AI agent that determines which Instantly campaign a lead should be routed to.
 *
 * Given an enriched lead, available campaigns (with live stats), and company context,
 * the agent decides: add to existing campaign, create a new one, or skip.
 */
import type { Lead, CampaignWithStats, Company, CampaignRoutingDecision } from '../types';
export interface DetermineCampaignParams {
    lead: Pick<Lead, 'email' | 'full_name' | 'category' | 'platform' | 'bio' | 'expertise' | 'total_audience' | 'content_types' | 'promotion_fit_score' | 'promotion_fit_reason'>;
    campaigns: CampaignWithStats[];
    company: Pick<Company, 'name' | 'description' | 'target_audience'>;
    autoMode?: boolean;
}
export declare function determineCampaignForLead(params: DetermineCampaignParams): Promise<CampaignRoutingDecision>;
