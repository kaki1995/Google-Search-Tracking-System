import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getReqContext } from '../_shared/context.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionEndRequest {
  participant_id: string;
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

    const body: SessionEndRequest = await req.json();
    const { participant_id } = body;

    if (!participant_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { nowUtc } = getReqContext(req);

    console.log(`Ending session for participant: ${participant_id}`);

    // Get active session
    const { data: activeSession, error: sessionFetchError } = await supabase
      .from('search_sessions')
      .select('*')
      .eq('participant_id', participant_id)
      .is('session_end_time', null)
      .single();

    if (sessionFetchError || !activeSession) {
      console.error('Session fetch error:', sessionFetchError);
      return new Response(
        JSON.stringify({ ok: false, error: 'No active session found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recompute counts as safety pass
    const { data: queries } = await supabase
      .from('queries')
      .select('id')
      .eq('session_id', activeSession.id);

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

    // Update session with end time
    const { error: updateError } = await supabase
      .from('search_sessions')
      .update({
        session_end_time: nowUtc.toISOString(),
        query_count: queryCount,
        total_clicked_results_count: totalClicks
      })
      .eq('id', activeSession.id);

    if (updateError) {
      console.error('Session update error:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to update session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into session_timing for audit
    const sessionStartTime = new Date(activeSession.session_start_time);
    const sessionDurationMs = nowUtc.getTime() - sessionStartTime.getTime();

    const { error: timingError } = await supabase
      .from('session_timing')
      .insert({
        participant_id,
        session_start_time: activeSession.session_start_time,
        session_end_time: nowUtc.toISOString(),
        session_duration_ms: Math.max(0, sessionDurationMs)
      });

    if (timingError) {
      console.error('Session timing insert error:', timingError);
      // Don't fail the request for timing audit errors
    }

    const durationSec = Math.max(0, Math.floor(sessionDurationMs / 1000));

    console.log(`Session ${activeSession.id} ended. Duration: ${durationSec}s, Queries: ${queryCount}, Clicks: ${totalClicks}`);

    return new Response(
      JSON.stringify({
        ok: true,
        session_id: activeSession.id,
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