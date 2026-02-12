import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      await resend.emails.send({
        from: process.env.DIGEST_FROM_EMAIL || 'autogtm <onboarding@resend.dev>',
        to: 'shreyans@cmnlabs.co',
        subject: `[autogtm] Invite request from ${name}`,
        text: `Name: ${name}\nEmail: ${email}${message ? `\n\nMessage:\n${message}` : ''}`,
        replyTo: email,
      });
    } else {
      console.log('[Invite Request]', { name, email, message });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
