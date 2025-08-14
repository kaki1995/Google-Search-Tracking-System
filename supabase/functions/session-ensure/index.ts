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

    console.log(`Ensuring session for participant: ${participant_id}`);

    // Ensure participant exists
    const { error: participantError } = await supabase
      .from('participants')
      .upsert({ 
        participant_id, 
        ip_address, 
        device_type 
      }, { 
        onConflict: 'participant_id' 
      });

    if (participantError) {
      console.error('Participant upsert error:', participantError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to ensure participant record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find active session (session_end_time IS NULL)
    const { data: activeSession, error: findError } = await supabase
      .from('search_sessions')
      .select('id')
      .eq('participant_id', participant_id)
      .is('session_end_time', null)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Active session find error:', findError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to find active session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sessionId;
    let isNew = false;

    if (activeSession) {
      sessionId = activeSession.id;
      console.log(`Found existing active session: ${sessionId}`);
    } else {
      // Create new session
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
        console.error('Session creation error:', createError);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      sessionId = newSession.id;
      isNew = true;
      console.log(`Created new session: ${sessionId}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        session_id: sessionId,
        isNew
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Session ensure endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});