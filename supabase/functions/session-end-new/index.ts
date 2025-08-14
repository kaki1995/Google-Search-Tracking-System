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
    const { participant_id } = body;

    if (!participant_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowUtc = new Date();

    console.log(`Ending session for participant: ${participant_id}`);

    // Find and end active session
    const { data: activeSession, error: findError } = await supabase
      .from('search_sessions')
      .select('*')
      .eq('participant_id', participant_id)
      .is('session_end_time', null)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ ok: false, error: 'No active session found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Active session find error:', findError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to find active session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update session end time
    const { error: updateError } = await supabase
      .from('search_sessions')
      .update({
        session_end_time: nowUtc.toISOString(),
        // Trigger will compute session_duration_ms
      })
      .eq('id', activeSession.id);

    if (updateError) {
      console.error('Session end update error:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to end session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also insert into session_timing for audit
    const sessionDurationMs = Math.max(0, nowUtc.getTime() - new Date(activeSession.session_start_time).getTime());
    
    const { error: auditError } = await supabase
      .from('session_timing')
      .insert({
        participant_id,
        session_start_time: activeSession.session_start_time,
        session_end_time: nowUtc.toISOString(),
        session_duration_ms: sessionDurationMs
      });

    if (auditError) {
      console.error('Session timing audit error:', auditError);
      // Don't fail the request for audit errors
    }

    return new Response(
      JSON.stringify({
        ok: true,
        session_id: activeSession.id,
        session_duration_ms: sessionDurationMs
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