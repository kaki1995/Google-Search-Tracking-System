import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { trackingService } from "@/lib/tracking";
import { enhancedTrackingService } from "@/lib/tracking_enhanced";
import { performGoogleSearch } from "@/lib/googleSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BrowserBar from "@/components/BrowserBar";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);
  const trackingInitialized = useRef(false);

  useEffect(() => {
    // Initialize tracking if not already done
    if (!trackingInitialized.current) {
      trackingService.startScrollTracking();
      // Initialize enhanced event listeners
      trackingService.setupEnhancedEventListeners();
      trackingInitialized.current = true;
    }
    
    const currentQuery = searchParams.get("q");
    if (currentQuery) {
      performSearch(currentQuery);
    }
  }, [searchParams]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      trackingService.stopScrollTracking();
    };
  }, []);

  const performSearch = async (searchQuery: string) => {
    // Input validation and sanitization
    const sanitizedQuery = searchQuery.trim();
    if (!sanitizedQuery) {
      toast({
        title: "Invalid query",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    // Basic XSS protection - reject queries with script tags or suspicious patterns
    if (/<script|javascript:|data:|vbscript:/i.test(sanitizedQuery)) {
      toast({
        title: "Invalid query",
        description: "Search query contains invalid characters",
        variant: "destructive",
      });
      return;
    }
    
    // Limit query length for security
    if (sanitizedQuery.length > 500) {
      toast({
        title: "Query too long",
        description: "Please limit your search to 500 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const searchResults = await performGoogleSearch(sanitizedQuery);
      setResults(Array.isArray(searchResults) ? searchResults : []);
      
      // Add to search history
      setSearchHistory(prev => {
        if (!prev.includes(sanitizedQuery)) {
          return [...prev, sanitizedQuery];
        }
        return prev;
      });
      
      // Track the search query and get query ID from both services
      const resultsCount = Array.isArray(searchResults) ? searchResults.length : 0;
      const queryId = await trackingService.trackQuery(sanitizedQuery, resultsCount);
      const enhancedQueryId = await enhancedTrackingService.trackQuery(sanitizedQuery, resultsCount);
      setCurrentQueryId(queryId || enhancedQueryId);
      
      // Track time to first result now that results are loaded
      if (queryId) {
        await trackingService.trackTimeToFirstResult(queryId);
      }
      if (enhancedQueryId) {
        await enhancedTrackingService.trackTimeToFirstResult(enhancedQueryId);
      }
      
      setSearchCount(prev => prev + 1);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Unable to perform search",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      performSearch(query.trim());
    }
  };

  const handleResultClick = async (result: SearchResult, index: number, event?: React.MouseEvent) => {
    try {
      // Validate URL before opening
      const url = new URL(result.link);
      if (!['http:', 'https:'].includes(url.protocol)) {
        toast({
          title: "Invalid URL",
          description: "This URL is not safe to open",
          variant: "destructive",
        });
        return;
      }
      
      // Track the click with enhanced details
      if (currentQueryId) {
        await enhancedTrackingService.trackClickWithDetails(
          result.link,
          result.title,
          index + 1,
          currentQueryId,
          {
            element_text: result.title,
            page_coordinates: event ? { x: event.clientX, y: event.clientY } : undefined,
            viewport_coordinates: event ? { x: event.clientX, y: event.clientY } : undefined,
            scroll_depth: window.scrollY,
            hover_duration_ms: 0
          }
        );
      }
      
      // Open in new tab with security attributes
      const newWindow = window.open(result.link, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast({
          title: "Pop-up blocked",
          description: "Please allow pop-ups for this site",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Invalid URL:', error);
      toast({
        title: "Invalid URL",
        description: "This URL is not valid",
        variant: "destructive",
      });
    }
  };

  const handleFinishTask = () => {
    navigate('/search-result-log');
  };

  const copyLink = (link: string) => {
    try {
      // Validate URL before copying (unless it's a search URL)
      if (!link.startsWith('/search?q=')) {
        const url = new URL(link);
        if (!['http:', 'https:'].includes(url.protocol)) {
          toast({
            title: "Invalid URL",
            description: "This URL is not safe to copy",
            variant: "destructive",
          });
          return;
        }
      }
      
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard",
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Hidden element to track current query ID for enhanced event listeners */}
      <div 
        data-current-query-id={currentQueryId || ''} 
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      
      <div className="w-full max-w-[905px] h-screen max-h-[680px] border-8 border-[#CAC4D0] rounded-[18px] bg-[#FEF7FF] overflow-hidden relative">
        {/* Browser Bar */}
        <div className="relative z-10">
          <BrowserBar />
        </div>

        {/* Google Interface */}
        <div className="relative h-full bg-white">
          {/* Header with search */}
          <div className="flex items-center justify-between p-4 border-b">
            {/* Google Logo */}
            <div className="flex items-center">
              <span className="text-3xl font-normal tracking-tight">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC04]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </span>
            </div>

            {/* Search Bar with Buttons */}
            <div className="flex items-center gap-4 flex-1 max-w-2xl mx-4">
              <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                <div className="flex items-center flex-1 border border-gray-300 rounded-full px-4 py-2">
                  <svg className="w-4 h-4 text-gray-400 mr-3" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 outline-none"
                    placeholder="Search Google or type a URL"
                  />
                </div>
                <Button 
                  type="submit"
                  className="bg-[#4285f4] hover:bg-[#3367d6] text-white px-6 py-2 rounded"
                >
                  Search
                </Button>
              </form>
              
              <Button
                onClick={handleFinishTask}
                className="bg-[#28a745] hover:bg-[#218838] text-white px-6 py-2 rounded ml-6"
              >
                Finish Task
              </Button>
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Search History:</h3>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((historyQuery, index) => (
                  <div key={index} className="flex items-center gap-1 bg-white border rounded px-2 py-1 text-xs">
                    <span>{historyQuery}</span>
                    <button
                      onClick={() => copyLink(`/search?q=${encodeURIComponent(historyQuery)}`)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                      title="Copy search link"
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">
                  About {results.length} results
                </p>
                
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className="space-y-1"
                    data-result-rank={index + 1}
                    data-result-url={result.link}
                    data-result-title={result.title}
                    data-query-id={currentQueryId || ''}
                  >
                    <div className="text-sm text-green-700">
                      {result.displayLink}
                      <button
                        onClick={() => copyLink(result.link)}
                        className="text-blue-600 hover:text-blue-800 ml-2 text-xs"
                        title="Copy link"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <button
                      onClick={(e) => handleResultClick(result, index, e)}
                      className="block text-left w-full"
                      data-result-rank={index + 1}
                      data-result-url={result.link}
                      data-result-title={result.title}
                      data-query-id={currentQueryId || ''}
                    >
                      <h3 className="text-xl text-blue-600 hover:underline cursor-pointer">
                        {result.title}
                      </h3>
                    </button>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.snippet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {searchParams.get("q") ? "No results found" : "Enter a search query to get started"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;