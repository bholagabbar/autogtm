const DEFAULT_POSTIZ_BASE_URL = 'https://api.postiz.com/public/v1';
function getPostizApiKey() {
    const apiKey = process.env.POSTIZ_API_KEY;
    if (!apiKey) {
        throw new Error('POSTIZ_API_KEY is required');
    }
    return apiKey;
}
function getPostizBaseUrl() {
    return process.env.POSTIZ_BASE_URL || DEFAULT_POSTIZ_BASE_URL;
}
async function postizFetch(endpoint, options = {}) {
    const apiKey = getPostizApiKey();
    const baseUrl = getPostizBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
            Authorization: apiKey,
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {}),
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Postiz API error: ${response.status} - ${errorText}`);
    }
    if (response.status === 204) {
        return undefined;
    }
    return response.json();
}
export async function uploadFile(fileBuffer, filename, mimeType = 'application/octet-stream') {
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, filename);
    return postizFetch('/upload', {
        method: 'POST',
        body: formData,
    });
}
export async function uploadFromUrl(url) {
    return postizFetch('/upload-from-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
}
export async function createPost(payload) {
    return postizFetch('/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
export async function deletePost(postId) {
    await postizFetch(`/posts/${postId}`, { method: 'DELETE' });
}
export async function listIntegrations() {
    const data = await postizFetch('/integrations');
    if (Array.isArray(data))
        return data;
    return data.integrations || [];
}
export async function getPostAnalytics(postId) {
    return postizFetch(`/analytics/post/${postId}`);
}
//# sourceMappingURL=postiz.js.map