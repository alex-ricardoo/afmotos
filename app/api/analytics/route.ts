import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = await createClient();
    
    // Attempt to insert an event into the analytics_events table
    // If the table doesn't exist, this will quietly fail on the client perspective 
    // but we can log it here.
    const { error } = await supabase.from('analytics_events').insert({
      event_type: data.event_type || 'page_view',
      url: data.url,
      path: data.path,
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: data.metadata || {}
    });

    if (error) {
      console.warn("Analytics Error:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}
