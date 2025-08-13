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
    const { participant_id } = body;

    if (!participant_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ip_address, device_type } = getClientInfo(req);
    const nowUtc = new Date();

    console.log(`Starting session for participant: ${participant_id}`);

    // Upsert search_sessions record
    const { data: session, error: sessionError } = await supabase
      .from('search_sessions')
      .upsert({
        participant_id,
        session_start_time: nowUtc.toISOString(),
        ip_address,
        device_type,
        query_count: 0,
        query_reformulation_count: 0,
        total_clicked_results_count: 0,
        scroll_depth_max: 0
      }, {
        onConflict: 'id'
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionId = session.id;
    console.log(`Session created with ID: ${sessionId}`);

    return new Response(
      JSON.stringify({
        ok: true,
        sessionId,
        participant_id
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Set-Cookie': `sid=${sessionId}; Path=/; HttpOnly; SameSite=Strict`
        } 
      }
    );

  } catch (error) {
    console.error('Session start endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});