
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

  console.log('Query endpoint called with method:', req.method);

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Failed to parse request JSON:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { session_id, query_text } = requestData;

    if (!session_id || !query_text) {
      console.log('Missing required fields:', { session_id, query_text });
      return new Response(
        JSON.stringify({ error: 'Missing session_id or query_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing query: "${query_text}" for session: ${session_id}`);

    // Test Google API access
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.error('Missing Google API credentials');
      return new Response(
        JSON.stringify({ error: 'Missing Google API credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Custom Search API
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query_text)}`;
    
    console.log('Making request to Google API...');
    const googleResponse = await fetch(googleUrl);
    
    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error('Google API error:', googleResponse.status, googleResponse.statusText, errorText);
      
      // Check if it's an API key issue
      if (googleResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Google API key invalid or quota exceeded' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Google API error: ${googleResponse.status}` }),
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

    // Log to Supabase experiment_queries table
    console.log('Logging query to Supabase...');
    const { data: insertData, error: insertError } = await supabase
      .from('experiment_queries')
      .insert({
        session_id,
        query_text
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to log query' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const actualQueryId = insertData?.id || queryId;
    console.log(`Query logged successfully with ID: ${actualQueryId}`);

    // Return formatted results with required structure
    const response = {
      query_id: actualQueryId,
      query_text,
      timestamp_query: timestamp,
      total_results: googleData.searchInformation?.totalResults || "0",
      results: searchResults
    };

    console.log('Returning successful response with', searchResults.length, 'results');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Query endpoint error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
