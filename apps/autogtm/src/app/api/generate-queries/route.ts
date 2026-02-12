import { NextRequest, NextResponse } from 'next/server';
import { generateExaQueries } from '@autogtm/core/ai/generateQueries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, website, description, targetAudience } = body;

    if (!name || !website || !description || !targetAudience) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const queries = await generateExaQueries({
      companyName: name,
      companyWebsite: website,
      companyDescription: description,
      targetAudience: targetAudience,
      numberOfQueries: 5,
    });

    return NextResponse.json({ queries });
  } catch (error) {
    console.error('Error generating queries:', error);
    return NextResponse.json(
      { error: 'Failed to generate queries' },
      { status: 500 }
    );
  }
}
