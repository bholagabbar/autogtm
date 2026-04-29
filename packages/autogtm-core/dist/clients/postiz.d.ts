export interface PostizUpload {
    id: string;
    path: string;
    [key: string]: unknown;
}
export interface PostizIntegration {
    id: string;
    name?: string;
    provider?: string;
    [key: string]: unknown;
}
export interface PostizCreatePostRequest {
    type: 'now' | 'schedule';
    date: string;
    shortLink?: boolean;
    tags?: string[];
    posts: Array<{
        integration: {
            id: string;
        };
        value: Array<{
            content: string;
            image?: Array<{
                id: string;
                path: string;
            }>;
        }>;
        settings: Record<string, unknown>;
    }>;
}
export interface PostizCreatePostResponse {
    id: string;
    releaseId?: string;
    [key: string]: unknown;
}
export interface PostizPostAnalytics {
    [key: string]: unknown;
}
export declare function uploadFile(fileBuffer: Buffer, filename: string, mimeType?: string): Promise<PostizUpload>;
export declare function uploadFromUrl(url: string): Promise<PostizUpload>;
export declare function createPost(payload: PostizCreatePostRequest): Promise<PostizCreatePostResponse>;
export declare function deletePost(postId: string): Promise<void>;
export declare function listIntegrations(): Promise<PostizIntegration[]>;
export declare function getPostAnalytics(postId: string): Promise<PostizPostAnalytics>;
