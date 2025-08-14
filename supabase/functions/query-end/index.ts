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
    const { query_id, participant_id } = body;

    if (!query_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'query_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowUtc = new Date();

    console.log(`Ending query: ${query_id}`);

    // Get the query record to calculate duration
    const { data: queryData, error: queryFetchError } = await supabase
      .from('queries')
      .select('start_time, session_id')
      .eq('id', query_id)
      .single();

    if (queryFetchError || !queryData) {
      console.error('Query fetch error:', queryFetchError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Query not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate duration
    const startTime = new Date(queryData.start_time);
    const durationMs = nowUtc.getTime() - startTime.getTime();
    const durationSec = Math.max(0, Math.floor(durationMs / 1000));

    // Update query record
    const { error: updateError } = await supabase
      .from('queries')
      .update({
        end_time: nowUtc.toISOString(),
        query_duration_sec: durationSec
      })
      .eq('id', query_id);

    if (updateError) {
      console.error('Query update error:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to update query' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update session query count
    const { data: sessionQueries } = await supabase
      .from('queries')
      .select('id')
      .eq('session_id', queryData.session_id);

    const queryCount = sessionQueries?.length || 0;

    await supabase
      .from('search_sessions')
      .update({ query_count: queryCount })
      .eq('id', queryData.session_id);

    console.log(`Query ${query_id} ended, duration: ${durationSec}s`);

    return new Response(
      JSON.stringify({
        ok: true,
        query_id,
        duration_sec: durationSec
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Query end endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});