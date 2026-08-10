import { NextRequest, NextResponse } from 'next/server';
import { createCompanyDomain, getCompanyDomains } from '@autogtm/core/db/autogtmDbCalls';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();

    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const record = await createCompanyDomain({
      company_id: companyId,
      domain: body.domain,
      verification_status: 'verification_pending',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating company domain:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const domains = await getCompanyDomains(companyId);
    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching company domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}
