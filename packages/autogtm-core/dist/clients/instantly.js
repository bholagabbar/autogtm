/**
 * Instantly V2 API Client
 * Docs: https://developer.instantly.ai/
 */
const INSTANTLY_API_BASE = 'https://api.instantly.ai/api/v2';
function getApiKey() {
    const apiKey = process.env.INSTANTLY_API_KEY;
    if (!apiKey) {
        throw new Error('INSTANTLY_API_KEY is required');
    }
    return apiKey;
}
async function instantlyFetch(endpoint, options = {}) {
    const apiKey = getApiKey();
    const response = await fetch(`${INSTANTLY_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instantly API error: ${response.status} - ${error}`);
    }
    return response.json();
}
/**
 * Create a new campaign with email sequences
 */
export async function createCampaign(params) {
    const schedule = params.schedule || {
        timezone: 'America/Chicago',
        from: '09:00',
        to: '17:00',
        days: { '1': true, '2': true, '3': true, '4': true, '5': true, '0': false, '6': false },
    };
    // Build sequences in Instantly V2 format (each step needs variants array)
    const sequences = [{
            steps: params.sequences.map((step, index) => ({
                type: 'email',
                delay: index === 0 ? 0 : (step.delay || 2) * 24 * 60, // Convert days to minutes
                variants: [{
                        subject: step.subject,
                        body: step.body,
                    }],
            })),
        }];
    const response = await instantlyFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
            name: params.name,
            campaign_schedule: {
                schedules: [{
                        name: 'Default Schedule',
                        timing: { from: schedule.from, to: schedule.to },
                        days: schedule.days,
                        timezone: schedule.timezone,
                    }],
            },
            sequences,
            email_list: params.emailList,
            daily_limit: params.dailyLimit || 50,
            stop_on_reply: params.stopOnReply ?? true,
            text_only: false,
            link_tracking: true,
            open_tracking: true,
        }),
    });
    return response;
}
/**
 * Add leads to a campaign (V2 API: one request per lead)
 */
export async function addLeadsToCampaign(campaignId, leads) {
    for (const lead of leads) {
        await instantlyFetch('/leads', {
            method: 'POST',
            body: JSON.stringify({
                campaign: campaignId,
                email: lead.email,
                first_name: lead.first_name || '',
                last_name: lead.last_name || '',
                company_name: lead.company_name || '',
                skip_if_in_campaign: true,
                ...(lead.variables && Object.keys(lead.variables).length > 0
                    ? { custom_variables: lead.variables }
                    : {}),
            }),
        });
    }
}
/**
 * Activate (start) a campaign
 */
export async function activateCampaign(campaignId) {
    await instantlyFetch(`/campaigns/${campaignId}/activate`, {
        method: 'POST',
        body: JSON.stringify({}),
    });
}
/**
 * Pause a campaign
 */
export async function pauseCampaign(campaignId) {
    await instantlyFetch(`/campaigns/${campaignId}/pause`, {
        method: 'POST',
        body: JSON.stringify({}),
    });
}
/**
 * Get campaign details
 */
export async function getCampaign(campaignId) {
    return instantlyFetch(`/campaigns/${campaignId}`);
}
/**
 * List all campaigns
 */
export async function listCampaigns(options) {
    const params = new URLSearchParams();
    if (options?.limit)
        params.set('limit', String(options.limit));
    if (options?.status !== undefined)
        params.set('status', String(options.status));
    const query = params.toString() ? `?${params}` : '';
    return instantlyFetch(`/campaigns${query}`);
}
/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId) {
    const response = await instantlyFetch(`/campaigns/analytics?campaign_id=${campaignId}`);
    return {
        sent: response.sent || 0,
        opened: response.opened || 0,
        replied: response.replied || 0,
        bounced: response.bounced || 0,
    };
}
/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId) {
    await instantlyFetch(`/campaigns/${campaignId}`, {
        method: 'DELETE',
    });
}
/**
 * List email accounts
 */
export async function listAccounts() {
    return instantlyFetch('/accounts');
}
/**
 * Convenience function: Create and start a campaign with leads
 */
export async function launchCampaign(params) {
    // Create campaign
    const campaign = await createCampaign({
        name: params.name,
        emailList: params.emailList,
        sequences: params.sequences,
    });
    // Add leads
    if (params.leads.length > 0) {
        await addLeadsToCampaign(campaign.id, params.leads);
    }
    // Activate
    await activateCampaign(campaign.id);
    return campaign;
}
//# sourceMappingURL=instantly.js.map