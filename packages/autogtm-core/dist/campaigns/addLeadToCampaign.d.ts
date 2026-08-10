/**
 * Regenerate a draft campaign's email copy fresh for the given lead and persist
 * the new sequence (with a version snapshot so undo still works). Used by
 * Autopilot when `auto_add_regenerate_drafts` is enabled, so stale copy doesn't
 * go out on autosend.
 *
 * No-op (returns false) when the campaign is not a draft or has no existing emails.
 */
export declare function regenerateAndSaveDraftEmails(params: {
    campaignId: string;
    leadId: string;
}): Promise<boolean>;
/** Result of attempting to add a single lead to its suggested campaign. */
export type AddLeadToCampaignResult = {
    ok: true;
    action: 'sent_draft' | 'added_to_active';
    campaignId: string;
    regenerated?: boolean;
} | {
    ok: false;
    reason: 'missing_email' | 'missing_name' | 'campaign_not_found' | 'campaign_full' | 'campaign_not_accepting' | 'lead_not_found' | 'error';
    message?: string;
};
/**
 * Shared core routine for routing a single lead into its suggested campaign.
 * Used by both the user-initiated add-to-campaign Inngest job and the
 * daily Auto Add sweep so behavior stays identical across paths.
 *
 * Caller is responsible for Inngest step wrapping / retries.
 */
export declare function addLeadToCampaignCore(params: {
    leadId: string;
    campaignId: string;
    /** When true, respects campaign cap/accepting flag and returns a structured skip
     *  reason instead of throwing. Used by the sweep to track reasons per-lead. */
    softFail?: boolean;
    /** When true and the lead is soft-failed as full/not-accepting, mark it skipped
     *  in the DB so the sweep doesn't re-consider it tomorrow. */
    markSkipped?: boolean;
    /** When true, regenerate & persist fresh draft copy BEFORE routing — only
     *  applies when the campaign is still a draft. Used by Autopilot when the
     *  `auto_add_regenerate_drafts` company preference is enabled. */
    regenerateDraftFirst?: boolean;
}): Promise<AddLeadToCampaignResult>;
