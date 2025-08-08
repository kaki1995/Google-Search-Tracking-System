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

// SECURITY: API credentials moved to secure Supabase edge function
// No longer exposing sensitive credentials in client-side code

// Updated to use secure Supabase edge function instead of exposed API keys
export async function performGoogleSearch(query: string, startIndex: number = 1): Promise<SearchResultsWithPagination> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('secure-google-search', {
      body: { query, startIndex }
    });
    
    if (error) {
      console.error('Error calling secure search function:', error);
      return {
        results: [],
        totalResults: 0,
        hasNextPage: false
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error performing Google search:', error);
    return {
      results: [],
      totalResults: 0,
      hasNextPage: false
    };
  }
}

// Legacy function for backward compatibility
export async function performGoogleSearchLegacy(query: string): Promise<GoogleSearchResult[]> {
  const result = await performGoogleSearch(query);
  return result.results;
}

export function generateGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}