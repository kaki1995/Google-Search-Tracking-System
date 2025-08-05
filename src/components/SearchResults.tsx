import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { trackingService } from "@/lib/tracking";
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
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const searchResults = await performGoogleSearch(searchQuery);
      setResults(searchResults);
      
      // Add to search history
      setSearchHistory(prev => {
        if (!prev.includes(searchQuery)) {
          return [...prev, searchQuery];
        }
        return prev;
      });
      
      // Track the search query and get query ID
      const queryId = await trackingService.trackQuery(searchQuery, searchResults.length);
      setCurrentQueryId(queryId);
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

  const handleResultClick = async (result: SearchResult, index: number) => {
    // Track the click
    await trackingService.trackClick(result.link, result.title, index + 1, currentQueryId || undefined);
    
    // Open in new tab to allow continued searching
    window.open(result.link, '_blank', 'noopener,noreferrer');
  };

  const handleFinishTask = () => {
    navigate('/search-result-log');
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
              <span className="text-2xl font-light">
                <span className="text-[#4285f4]">G</span>
                <span className="text-[#ea4335]">o</span>
                <span className="text-[#fbbc04]">o</span>
                <span className="text-[#4285f4]">g</span>
                <span className="text-[#34a853]">l</span>
                <span className="text-[#ea4335]">e</span>
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
                  <div key={index} className="space-y-1">
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
                      onClick={() => handleResultClick(result, index)}
                      className="block text-left w-full"
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