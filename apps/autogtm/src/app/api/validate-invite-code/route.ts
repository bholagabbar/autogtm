import { NextRequest, NextResponse } from 'next/server';

const VALID_INVITE_CODES = (process.env.INVITE_CODES || 'GTMBETA').split(',').map(c => c.trim().toUpperCase());

export async function POST(request: NextRequest) {
  const { inviteCode } = await request.json();

  if (!inviteCode || typeof inviteCode !== 'string') {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  const isValid = VALID_INVITE_CODES.includes(inviteCode.toUpperCase());

  if (isValid) {
    return NextResponse.json({ valid: true });
  } else {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
  }
}
