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
    const { session_id, query_text, query_order, query_structure } = body;

    if (!session_id || !query_text) {
      return new Response(
        JSON.stringify({ ok: false, error: 'session_id and query_text are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ip_address, device_type } = getClientInfo(req);
    const nowUtc = new Date();

    console.log(`Starting query for session: ${session_id}, query: ${query_text}`);

    // Compute query_order if not provided
    let finalQueryOrder = query_order;
    if (!finalQueryOrder) {
      const { data: existingQueries } = await supabase
        .from('queries')
        .select('query_order')
        .eq('session_id', session_id)
        .order('query_order', { ascending: false })
        .limit(1);
      
      finalQueryOrder = existingQueries && existingQueries.length > 0 
        ? (existingQueries[0].query_order || 0) + 1 
        : 1;
    }

    // Insert query record
    const { data: query, error: queryError } = await supabase
      .from('queries')
      .insert({
        session_id,
        query_order: finalQueryOrder,
        query_text,
        query_structure: query_structure || null,
        start_time: nowUtc.toISOString(),
        click_count: 0,
        ip_address,
        device_type
      })
      .select('id')
      .single();

    if (queryError) {
      console.error('Query creation error:', queryError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to create query record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const queryId = query.id;
    console.log(`Query created with ID: ${queryId}`);

    return new Response(
      JSON.stringify({
        ok: true,
        query_id: queryId,
        session_id,
        query_order: finalQueryOrder
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Query start endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});