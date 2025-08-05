import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = "AIzaSyATKkbTWhLwe0RgeWoY_iiMW7w2QoPkWpw";
const GOOGLE_SEARCH_ENGINE_ID = "007dc6ac33e6f436c";

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

    const { session_id, query_text } = await req.json();

    if (!session_id || !query_text) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or query_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing query: "${query_text}" for session: ${session_id}`);

    // Call Google Custom Search API
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query_text)}`;
    
    const googleResponse = await fetch(googleUrl);
    
    if (!googleResponse.ok) {
      console.error('Google API error:', googleResponse.status, googleResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch search results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleData = await googleResponse.json();
    console.log('Google API response received, items count:', googleData.items?.length || 0);

    // Extract and format results
    const items = googleData.items || [];
    const searchResults = items.slice(0, 10).map((item: any, index: number) => ({
      rank: index + 1,
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));

    // Generate query ID and timestamp
    const queryId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Log to Supabase queries table
    const { error: insertError } = await supabase
      .from('queries')
      .insert({
        query_id: queryId,
        session_id,
        query_text,
        timestamp_query: timestamp,
        search_results: googleData,
        query_reformulation: false
      });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to log query' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Query logged successfully with ID: ${queryId}`);

    // Return formatted results with required structure
    return new Response(
      JSON.stringify({
        query_id: queryId,
        query_text,
        timestamp_query: timestamp,
        total_results: googleData.searchInformation?.totalResults || "0",
        results: searchResults
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Query endpoint error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});