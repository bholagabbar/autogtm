import OpenAI from 'openai';
import { z } from 'zod';
const DraftSchema = z.object({
    caption: z.string().min(1),
    hashtags: z.array(z.string()).default([]),
    image_prompt: z.string().min(1),
});
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
        throw new Error('OPENAI_API_KEY is required');
    return new OpenAI({ apiKey });
}
export async function draftSocialPost(theme, dataItem) {
    const openai = getOpenAIClient();
    const response = await openai.responses.create({
        model: 'gpt-4.1-mini',
        input: `You are an elite social media copywriter.
Generate one Instagram-ready post draft.

Theme:
${JSON.stringify(theme, null, 2)}

Data item:
${JSON.stringify(dataItem, null, 2)}

Rules:
- Caption should be concise and human.
- Hashtags should be relevant, plain words (with or without #).
- Build image_prompt by combining image_prompt_template + concrete details from data item.
- Do not hallucinate facts not implied by data.

Return strict JSON:
{
  "caption": "string",
  "hashtags": ["tag1", "tag2"],
  "image_prompt": "string"
}`,
    });
    const text = response.output_text || '';
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = fenced ? fenced[1].trim() : text.trim();
    const parsed = DraftSchema.parse(JSON.parse(jsonText));
    const hashtags = parsed.hashtags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`));
    return {
        caption: parsed.caption.trim(),
        hashtags,
        image_prompt: parsed.image_prompt.trim(),
    };
}
//# sourceMappingURL=draftSocialPost.js.map