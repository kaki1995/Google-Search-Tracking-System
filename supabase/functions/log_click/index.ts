import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query_id, clicked_url, clicked_rank } = await req.json();

    if (!query_id || !clicked_url || clicked_rank === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing query_id, clicked_url, or clicked_rank' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Logging click: query_id=${query_id}, url=${clicked_url}, rank=${clicked_rank}`);

    // Update the queries table with click information
    const { error: updateError } = await supabase
      .from('queries')
      .update({
        clicked_url,
        clicked_rank
      })
      .eq('query_id', query_id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to log click' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Click logged successfully for query: ${query_id}`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});