/**
 * Database operations for AutoGTM
 * Uses Supabase as the data store
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Company, ExaQuery, WebsetRun, Lead, Campaign, CampaignWithStats, CampaignEmail, DailyDigest, AllowedUser, AutoAddRun, AutoAddRunBreakdownEntry } from '../types';
export declare function getSupabaseClient(): SupabaseClient;
export declare function createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company>;
export declare function getCompany(id: string): Promise<Company | null>;
export declare function listCompanies(): Promise<Company[]>;
export declare function updateCompany(id: string, updates: Partial<Company>): Promise<Company>;
export declare function createExaQuery(query: Omit<ExaQuery, 'id' | 'created_at' | 'updated_at'>): Promise<ExaQuery>;
export declare function getExaQueriesForCompany(companyId: string): Promise<ExaQuery[]>;
export declare function getActiveExaQueries(): Promise<ExaQuery[]>;
export declare function updateExaQuery(id: string, updates: Partial<ExaQuery>): Promise<ExaQuery>;
export declare function deleteExaQuery(id: string): Promise<void>;
export declare function createWebsetRun(run: Omit<WebsetRun, 'id'>): Promise<WebsetRun>;
export declare function updateWebsetRun(id: string, updates: Partial<WebsetRun>): Promise<WebsetRun>;
export declare function getLatestWebsetRun(queryId: string): Promise<WebsetRun | null>;
export declare function createLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead>;
export declare function createLeads(leads: Omit<Lead, 'id' | 'created_at'>[]): Promise<Lead[]>;
export declare function getLeadsForQuery(queryId: string): Promise<Lead[]>;
export declare function getLeadsWithEmails(queryId: string): Promise<Lead[]>;
export declare function checkLeadExists(url: string): Promise<boolean>;
export declare function getLeadsByDateRange(startDate: string, endDate: string): Promise<Lead[]>;
export declare function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign>;
export declare function getCampaign(id: string): Promise<Campaign | null>;
export declare function listCampaigns(companyId: string): Promise<Campaign[]>;
export declare function updateCampaignStats(id: string, stats: {
    emails_sent?: number;
    opens?: number;
    replies?: number;
}): Promise<Campaign>;
export declare function getActiveCampaignsForCompany(companyId: string): Promise<Campaign[]>;
export declare function getCampaignsWithStats(companyId: string): Promise<CampaignWithStats[]>;
export declare function incrementCampaignLeadCount(campaignId: string): Promise<void>;
export declare function markLeadRouted(leadId: string, campaignId: string): Promise<void>;
export declare function setSuggestedCampaign(leadId: string, campaignId: string, reason: string): Promise<void>;
export declare function markLeadSkipped(leadId: string, reason: string): Promise<void>;
export declare function createCampaignEmails(emails: Omit<CampaignEmail, 'id' | 'created_at'>[]): Promise<CampaignEmail[]>;
export declare function getCampaignEmails(campaignId: string): Promise<CampaignEmail[]>;
export declare function updateCampaign(id: string, updates: Partial<Pick<Campaign, 'name' | 'persona' | 'status' | 'instantly_campaign_id' | 'updated_at'>>): Promise<Campaign>;
export declare function getCampaignBySourceLeadId(leadId: string): Promise<Campaign | null>;
export declare function replaceCampaignEmails(campaignId: string, emails: Array<Pick<CampaignEmail, 'step' | 'subject' | 'body' | 'delay_days'>>): Promise<CampaignEmail[]>;
export declare function createDailyDigest(digest: Omit<DailyDigest, 'id'>): Promise<DailyDigest>;
export declare function getDigestsForCompany(companyId: string, limit?: number): Promise<DailyDigest[]>;
export declare function isUserAllowed(email: string): Promise<boolean>;
export declare function addAllowedUser(email: string): Promise<AllowedUser>;
export declare function listAllowedUsers(): Promise<AllowedUser[]>;
export declare function getCompanyStats(companyId: string): Promise<{
    totalLeads: number;
    leadsWithEmails: number;
    totalCampaigns: number;
    totalEmailsSent: number;
    totalOpens: number;
    totalReplies: number;
}>;
/** Leads that qualify for the daily auto-add sweep for a given company. */
export interface AutoAddEligibleLead {
    id: string;
    email: string;
    full_name: string;
    promotion_fit_score: number;
    suggested_campaign_id: string;
    category: string | null;
    bio: string | null;
    suggested_campaign_reason: string | null;
}
/** All companies with autopilot enabled AND the master system enabled, returning
 *  only fields needed by the sweep. Gating on both makes Autopilot a strict
 *  subset of System — turning System off guarantees the sweep is a no-op. */
export declare function listAutoEnabledCompanies(): Promise<Array<Pick<Company, 'id' | 'name' | 'auto_add_enabled' | 'auto_add_min_fit_score' | 'auto_add_daily_limit' | 'auto_add_run_hour_utc' | 'auto_add_digest_email'>>>;
/**
 * Fetch up to `limit` leads eligible for auto-add, sorted by fit score desc then recency.
 * A lead is eligible when it has a suggested campaign belonging to this company,
 * a valid email + name, a fit score at or above the configured threshold, and is
 * not yet routed/skipped.
 *
 * Two small queries beat one big one here: campaign ids first (indexed on company_id),
 * then `leads` filtered by `suggested_campaign_id IN (...)` — all filtering server-side,
 * no over-fetch, result count == `limit` at most.
 */
export declare function getEligibleLeadsForAutoAdd(companyId: string, minFitScore: number, limit: number): Promise<AutoAddEligibleLead[]>;
/** Count of remaining Ready-to-Add leads at or above a fit threshold, used in digest footer. */
export declare function countReadyToAddLeads(companyId: string, minFitScore: number): Promise<number>;
export declare function createAutoAddRun(params: {
    companyId: string;
    minFitScore: number;
    dailyLimit: number;
    trigger: 'cron' | 'manual';
}): Promise<AutoAddRun>;
export declare function completeAutoAddRun(runId: string, updates: {
    leads_considered?: number;
    leads_added?: number;
    leads_skipped?: number;
    breakdown?: AutoAddRunBreakdownEntry[];
    added_lead_ids?: string[];
    skip_reasons?: Record<string, number>;
    digest_sent?: boolean;
    digest_error?: string | null;
    error?: string | null;
}): Promise<void>;
export declare function getRecentAutoAddRuns(companyId: string, limit?: number): Promise<AutoAddRun[]>;
