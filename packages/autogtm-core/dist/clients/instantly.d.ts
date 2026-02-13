/**
 * Instantly V2 API Client
 * Docs: https://developer.instantly.ai/
 */
import type { InstantlyCampaign, InstantlyLead, InstantlySequenceStep } from '../types';
export interface CreateCampaignParams {
    name: string;
    emailList: string[];
    sequences: InstantlySequenceStep[];
    schedule?: {
        timezone: string;
        from: string;
        to: string;
        days: Record<string, boolean>;
    };
    dailyLimit?: number;
    stopOnReply?: boolean;
}
/**
 * Create a new campaign with email sequences
 */
export declare function createCampaign(params: CreateCampaignParams): Promise<InstantlyCampaign>;
/**
 * Add leads to a campaign (V2 API: one request per lead)
 */
export declare function addLeadsToCampaign(campaignId: string, leads: InstantlyLead[]): Promise<void>;
/**
 * Activate (start) a campaign
 */
export declare function activateCampaign(campaignId: string): Promise<void>;
/**
 * Pause a campaign
 */
export declare function pauseCampaign(campaignId: string): Promise<void>;
/**
 * Get campaign details
 */
export declare function getCampaign(campaignId: string): Promise<InstantlyCampaign>;
/**
 * List all campaigns
 */
export declare function listCampaigns(options?: {
    limit?: number;
    status?: number;
}): Promise<{
    items: InstantlyCampaign[];
}>;
/**
 * Get campaign analytics
 */
export declare function getCampaignAnalytics(campaignId: string): Promise<{
    sent: number;
    opened: number;
    replied: number;
    bounced: number;
}>;
/**
 * Delete a campaign
 */
export declare function deleteCampaign(campaignId: string): Promise<void>;
/**
 * List email accounts
 */
export declare function listAccounts(): Promise<{
    items: Array<{
        email: string;
        status: number;
        warmup_status: number;
        daily_limit: number | null;
    }>;
}>;
/**
 * Convenience function: Create and start a campaign with leads
 */
export declare function launchCampaign(params: {
    name: string;
    emailList: string[];
    sequences: InstantlySequenceStep[];
    leads: InstantlyLead[];
}): Promise<InstantlyCampaign>;
