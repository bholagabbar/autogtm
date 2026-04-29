export type SocialAssetMode = 'image' | 'video';
export type OpenRouterVideoModel = 'google/veo-3.1-fast' | 'bytedance/seedance-2.0-fast';
export declare function ensureSocialImageBucket(bucketName?: string): Promise<void>;
export declare function generateSocialImage(params: {
    prompt: string;
    companyId: string;
    postId: string;
    mode?: SocialAssetMode;
    videoModel?: OpenRouterVideoModel;
    bucketName?: string;
}): Promise<{
    imageUrl: string;
    storagePath: string;
}>;
