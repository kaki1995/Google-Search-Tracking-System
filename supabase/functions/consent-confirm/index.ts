import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getClientInfo } from '../_shared/context.ts';

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

    const { ip_address, device_type } = getClientInfo(req);
    const nowUtc = new Date();

    console.log(`Consent confirmed for participant: ${participant_id}`);

    // Ensure participant exists first
    const { data: pExist, error: pErr } = await supabase
      .from('participants')
      .select('participant_id')
      .eq('participant_id', participant_id)
      .maybeSingle();

    if (pErr) {
      console.error('participants select error', pErr);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to check participant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pExist) {
      const { error: insP } = await supabase
        .from('participants')
        .insert([{ participant_id }]);
      if (insP) {
        console.error('participants insert error', insP);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to create participant' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log(`Created new participant: ${participant_id}`);
    }

    // End any active session for this participant
    const { error: endSessionError } = await supabase
      .from('search_sessions')
      .update({ session_end_time: nowUtc.toISOString() })
      .eq('participant_id', participant_id)
      .is('session_end_time', null);

    if (endSessionError) {
      console.error('End previous session error:', endSessionError);
      // Don't fail - continue with creating new session
    }

    // Create new fresh session
    const { data: newSession, error: createError } = await supabase
      .from('search_sessions')
      .insert({
        participant_id,
        session_start_time: nowUtc.toISOString(),
        query_count: 0,
        total_clicked_results_count: 0,
        ip_address,
        device_type
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Fresh session creation error:', createError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to create fresh session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also create session_timing record
    const { error: timingError } = await supabase
      .from('session_timing')
      .insert({
        participant_id,
        session_start_time: nowUtc.toISOString()
      });

    if (timingError) {
      console.error('Session timing creation error:', timingError);
      // Don't fail the request for timing errors
    }

    return new Response(
      JSON.stringify({
        ok: true,
        session_id: newSession.id,
        message: 'Fresh session started after consent'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Consent confirm endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});