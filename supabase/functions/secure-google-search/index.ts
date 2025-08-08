import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  queries?: {
    nextPage?: Array<{
      startIndex: number;
    }>;
  };
}

interface SearchResultsWithPagination {
  results: GoogleSearchResult[];
  totalResults: number;
  hasNextPage: boolean;
  nextStartIndex?: number;
}

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
    // Get secure API credentials from environment
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
    
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Google API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, startIndex = 1 } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RESULTS_PER_PAGE = 10;
    const MAX_RESULTS = 100;
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&start=${startIndex}`;
    
    console.log(`Performing Google search for query: "${query}" at startIndex: ${startIndex}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Search API error: ${response.status}`);
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data: GoogleSearchResponse = await response.json();
    
    const results = data.items || [];
    const totalResults = parseInt(data.searchInformation?.totalResults || '0');
    const hasNextPage = (data.queries?.nextPage && data.queries.nextPage.length > 0) && 
                       startIndex + RESULTS_PER_PAGE <= MAX_RESULTS;
    const nextStartIndex = hasNextPage ? data.queries?.nextPage?.[0]?.startIndex : undefined;
    
    const searchResults: SearchResultsWithPagination = {
      results,
      totalResults,
      hasNextPage,
      nextStartIndex
    };

    console.log(`Search completed successfully: ${results.length} results returned`);
    
    return new Response(JSON.stringify(searchResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in secure-google-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to perform search',
        results: [],
        totalResults: 0,
        hasNextPage: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});