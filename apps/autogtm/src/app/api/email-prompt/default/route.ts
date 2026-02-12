import { NextResponse } from 'next/server';
import { DEFAULT_EMAIL_PROMPT } from '@autogtm/core/ai/generateEmailCopy';

export async function GET() {
  return NextResponse.json({ prompt: DEFAULT_EMAIL_PROMPT });
}
