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
    const { query_id, clicked_url, clicked_rank } = body;

    if (!query_id || !clicked_url) {
      return new Response(
        JSON.stringify({ ok: false, error: 'query_id and clicked_url are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ip_address, device_type } = getClientInfo(req);
    const nowUtc = new Date();

    console.log(`Logging click for query: ${query_id}, URL: ${clicked_url}, rank: ${clicked_rank}`);

    // Get current click count for this query to determine click_order
    const { data: existingClicks } = await supabase
      .from('query_clicks')
      .select('click_order')
      .eq('query_id', query_id)
      .order('click_order', { ascending: false })
      .limit(1);

    const clickOrder = existingClicks && existingClicks.length > 0 
      ? (existingClicks[0].click_order || 0) + 1 
      : 1;

    // Insert click record
    const { data: click, error: clickError } = await supabase
      .from('query_clicks')
      .insert({
        query_id,
        click_order: clickOrder,
        click_time: nowUtc.toISOString(),
        clicked_rank: clicked_rank || null,
        clicked_url,
        ip_address,
        device_type
      })
      .select('id')
      .single();

    if (clickError) {
      console.error('Click insert error:', clickError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to log click' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update queries.click_count
    const { data: allClicksForQuery } = await supabase
      .from('query_clicks')
      .select('id')
      .eq('query_id', query_id);

    const totalClicksForQuery = allClicksForQuery?.length || 0;

    await supabase
      .from('queries')
      .update({ click_count: totalClicksForQuery })
      .eq('id', query_id);

    // Update search_sessions.total_clicked_results_count
    const { data: queryData } = await supabase
      .from('queries')
      .select('session_id')
      .eq('id', query_id)
      .single();

    if (queryData) {
      const { data: allSessionClicks } = await supabase
        .from('queries')
        .select('id')
        .eq('session_id', queryData.session_id);

      const sessionQueryIds = allSessionClicks?.map(q => q.id) || [];
      
      const { data: sessionClicks } = await supabase
        .from('query_clicks')
        .select('id')
        .in('query_id', sessionQueryIds);

      const totalSessionClicks = sessionClicks?.length || 0;

      await supabase
        .from('search_sessions')
        .update({ total_clicked_results_count: totalSessionClicks })
        .eq('id', queryData.session_id);
    }

    console.log(`Click logged with ID: ${click.id}, order: ${clickOrder}`);

    return new Response(
      JSON.stringify({
        ok: true,
        click_id: click.id,
        click_order: clickOrder,
        query_id,
        clicked_url,
        clicked_rank
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Log click endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});