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
}

const GOOGLE_API_KEY = "AIzaSyATKkbTWhLwe0RgeWoY_iiMW7w2QoPkWpw";
const GOOGLE_SEARCH_ENGINE_ID = "007dc6ac33e6f436c";

export async function performGoogleSearch(query: string): Promise<GoogleSearchResult[]> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data: GoogleSearchResponse = await response.json();
    
    return data.items || [];
  } catch (error) {
    console.error('Error performing Google search:', error);
    return [];
  }
}

export function generateGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}