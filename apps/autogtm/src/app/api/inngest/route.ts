import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { functions } from '@/inngest/functions';

const handler = serve({
  client: inngest,
  functions,
});

export const GET = handler.GET as any;
export const POST = handler.POST as any;
export const PUT = handler.PUT as any;
