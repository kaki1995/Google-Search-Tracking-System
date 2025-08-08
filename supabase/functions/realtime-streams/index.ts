import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'track-interaction-detail':
        return await handleInteractionDetail(req, supabase);
      case 'track-query-timing':
        return await handleQueryTiming(req, supabase);
      case 'get-session-summary':
        return await handleSessionSummary(req, supabase);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleInteractionDetail(req: Request, supabase: any) {
  const { interaction_id, interaction_type, element_id, value } = await req.json();

  const { data, error } = await supabase
    .from('interaction_details')
    .insert({
      interaction_id,
      interaction_type,
      element_id,
      value
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting interaction detail:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleQueryTiming(req: Request, supabase: any) {
  const {
    query_id,
    search_duration_ms,
    time_to_first_result,
    time_to_first_click_ms,
    results_loaded_count,
    user_clicked,
    user_scrolled,
    query_abandoned
  } = await req.json();

  const { data, error } = await supabase
    .from('query_timing_metrics')
    .insert({
      query_id,
      search_duration_ms,
      time_to_first_result,
      time_to_first_click_ms,
      results_loaded_count,
      user_clicked,
      user_scrolled,
      query_abandoned,
      query_end_time: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting query timing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSessionSummary(req: Request, supabase: any) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Session ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('session_timing_summary')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching session summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: data || null }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}