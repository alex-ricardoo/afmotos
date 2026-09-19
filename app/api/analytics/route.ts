import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = await createClient();

    // Attempt to insert an event into the analytics_events table
    // Consolidate url, path, and other data into metadata JSONB to match DB schema
    const metadata = {
      ...(typeof data.metadata === 'object' && data.metadata !== null ? data.metadata : {}),
      path: data.path || null,
      url: data.url || null,
    };

    const { error } = await supabase.from('analytics_events').insert({
      event_type: data.event_type || data.eventType || 'page_view',
      motorcycle_id: data.motorcycle_id || data.motorcycleId || null,
      lead_id: data.lead_id || data.leadId || null,
      source: data.source || (data.path ? `web:${data.path}` : 'web'),
      session_id: data.session_id || data.sessionId || null,
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata,
    });

    if (error) {
      console.warn('Analytics Error:', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}
