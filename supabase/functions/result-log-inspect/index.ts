import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { participant_id, session_id, limit = 5 } = body || {};

    if (!participant_id && !session_id) {
      return new Response(JSON.stringify({ ok: false, error: 'participant_id or session_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let query = supabase.from('search_result_log').select('*').order('created_at', { ascending: false }).limit(limit);
    if (participant_id) query = query.eq('participant_id', participant_id);
    if (session_id) query = query.eq('session_id', session_id);

    const { data, error } = await query;
    if (error) {
      console.error('result-log-inspect select error:', error);
      return new Response(JSON.stringify({ ok: false, error: 'Failed to fetch records', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, count: data?.length || 0, records: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('result-log-inspect exception:', e);
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
