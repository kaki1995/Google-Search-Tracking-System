import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { session_id } = body;

    if (!session_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowUtc = new Date();

    console.log(`Ending session: ${session_id}`);

    // Get current session data
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from('search_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionFetchError || !sessionData) {
      console.error('Session fetch error:', sessionFetchError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recompute query_count and total_clicked_results_count as safety pass
    const { data: queries } = await supabase
      .from('queries')
      .select('id')
      .eq('session_id', session_id);

    const queryCount = queries?.length || 0;

    // Count total clicks across all queries in this session
    let totalClicks = 0;
    if (queries && queries.length > 0) {
      const queryIds = queries.map(q => q.id);
      const { data: clicks } = await supabase
        .from('query_clicks')
        .select('id')
        .in('query_id', queryIds);
      totalClicks = clicks?.length || 0;
    }

    // Update session with final data
    const { error: updateError } = await supabase
      .from('search_sessions')
      .update({
        session_end_time: nowUtc.toISOString(),
        query_count: queryCount,
        total_clicked_results_count: totalClicks
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Session update error:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to update session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = new Date(sessionData.session_start_time);
    const durationMs = nowUtc.getTime() - startTime.getTime();
    const durationSec = Math.max(0, Math.floor(durationMs / 1000));

    console.log(`Session ${session_id} ended. Duration: ${durationSec}s, Queries: ${queryCount}, Clicks: ${totalClicks}`);

    return new Response(
      JSON.stringify({
        ok: true,
        session_id,
        duration_sec: durationSec,
        query_count: queryCount,
        total_clicks: totalClicks
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Session end endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});