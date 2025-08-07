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

const GOOGLE_API_KEY = "AIzaSyATKkbTWhLwe0RgeWoY_iiMW7w2QoPkWpw";
const GOOGLE_SEARCH_ENGINE_ID = "007dc6ac33e6f436c";
const RESULTS_PER_PAGE = 10; // Google Custom Search API returns 10 results per page
const MAX_RESULTS = 100; // Google Custom Search API limits to 100 results total

export async function performGoogleSearch(query: string, startIndex: number = 1): Promise<SearchResultsWithPagination> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&start=${startIndex}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data: GoogleSearchResponse = await response.json();
    
    const results = data.items || [];
    const totalResults = parseInt(data.searchInformation?.totalResults || '0');
    const hasNextPage = (data.queries?.nextPage && data.queries.nextPage.length > 0) && 
                       startIndex + RESULTS_PER_PAGE <= MAX_RESULTS;
    const nextStartIndex = hasNextPage ? data.queries?.nextPage?.[0]?.startIndex : undefined;
    
    return {
      results,
      totalResults,
      hasNextPage,
      nextStartIndex
    };
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