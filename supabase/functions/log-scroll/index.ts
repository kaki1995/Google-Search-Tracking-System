import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getClientInfo(req: Request) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip_address = (fwd.split(',')[0] || '').trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-client-ip') || null;
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  const device_type = /mobile|iphone|android/.test(ua)
    ? 'mobile'
    : /ipad|tablet/.test(ua)
    ? 'tablet'
    : 'desktop';
  return { ip_address, device_type };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { session_id, path, max_scroll_pct } = body;

    if (!session_id || max_scroll_pct === undefined) {
      return new Response(
        JSON.stringify({ ok: false, error: 'session_id and max_scroll_pct are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (max_scroll_pct < 0 || max_scroll_pct > 100) {
      return new Response(
        JSON.stringify({ ok: false, error: 'max_scroll_pct must be between 0 and 100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ip_address, device_type } = getClientInfo(req);
    const nowUtc = new Date();

    console.log(`Logging scroll for session: ${session_id}, scroll: ${max_scroll_pct}%`);

    // Try to insert into scroll_events table if it exists
    try {
      await supabase
        .from('scroll_events')
        .insert({
          session_id,
          path: path || window?.location?.pathname || '/',
          max_scroll_pct: Math.round(max_scroll_pct),
          recorded_at: nowUtc.toISOString(),
          ip_address,
          device_type
        });
      console.log('Scroll event recorded in scroll_events table');
    } catch (scrollError) {
      console.log('scroll_events table may not exist, continuing with session update only');
    }

    // Update search_sessions.scroll_depth_max
    const { data: sessionData } = await supabase
      .from('search_sessions')
      .select('scroll_depth_max')
      .eq('id', session_id)
      .single();

    const currentMaxScroll = sessionData?.scroll_depth_max || 0;
    const newMaxScroll = Math.max(currentMaxScroll, Math.round(max_scroll_pct));

    const { error: updateError } = await supabase
      .from('search_sessions')
      .update({ scroll_depth_max: newMaxScroll })
      .eq('id', session_id);

    if (updateError) {
      console.error('Session scroll update error:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to update session scroll depth' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Session scroll depth updated: ${newMaxScroll}%`);

    return new Response(
      JSON.stringify({
        ok: true,
        session_id,
        max_scroll_pct: newMaxScroll
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Log scroll endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});