import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Mic, Settings, MoreVertical } from "lucide-react";
import { trackingService } from "@/lib/tracking";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const apiKey = "AIzaSyATKkbTWhLwe0RgeWoY_iiMW7w2QoPkWpw";
  const searchEngineId = "007dc6ac33e6f436c";
  const [searchCount, setSearchCount] = useState(0);
  const trackingInitialized = useRef(false);

  useEffect(() => {
    // Initialize tracking if not already done
    if (!trackingInitialized.current) {
      trackingService.startScrollTracking();
      trackingInitialized.current = true;
    }
    
    const currentQuery = searchParams.get("q");
    if (currentQuery) {
      performSearch(currentQuery, apiKey, searchEngineId);
    }
  }, [searchParams]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      trackingService.stopScrollTracking();
    };
  }, []);


  const performSearch = async (searchQuery: string, key: string, engineId: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${engineId}&q=${encodeURIComponent(
          searchQuery
        )}&num=10`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const searchResults: SearchResult[] = data.items?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
      })) || [];

      setResults(searchResults);
      
      // Track the search query
      await trackingService.trackQuery(searchQuery, searchResults.length);
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
      performSearch(query.trim(), apiKey, searchEngineId);
    }
  };

  const handleResultClick = async (result: SearchResult, index: number) => {
    // Track the click
    await trackingService.trackClick(result.link, result.title, index + 1);
    
    // Open in new tab to allow continued searching
    window.open(result.link, '_blank', 'noopener,noreferrer');
  };

  const handleFinishTask = () => {
    navigate('/post-task-survey');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 gap-4">
          {/* Logo */}
          <button 
            onClick={() => navigate("/")}
            className="text-2xl font-normal hover:opacity-80 transition-opacity"
          >
            <span className="text-google-blue">G</span>
            <span className="text-destructive">o</span>
            <span className="text-yellow-500">o</span>
            <span className="text-google-blue">g</span>
            <span className="text-green-500">l</span>
            <span className="text-destructive">e</span>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-google-text-light">
                <Search className="h-5 w-5" />
              </div>
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-10 pl-12 pr-12 text-base border-border rounded-full shadow-search focus:shadow-lg transition-shadow duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-google-text-light hover:text-google-text transition-colors"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Settings */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleFinishTask}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Finish Task
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-google-text-light">
                About {results.length} results
              </p>
              {searchCount > 0 && (
                <div className="text-xs text-blue-600">
                  Searches: {searchCount} | Clicks: {trackingService.getSessionData()?.searchPhase.clicks.length || 0}
                </div>
              )}
            </div>
            
            {searchCount > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Research Task:</strong> You're looking for the best restaurant for a special dinner. 
                  Continue searching and clicking on relevant results. When ready to make your final decision, 
                  click the "Finish Task" button above.
                </p>
              </div>
            )}
            {results.map((result, index) => (
              <div key={index} className="space-y-1">
                <div className="text-sm text-google-text-light">
                  {result.displayLink}
                </div>
                <button
                  onClick={() => handleResultClick(result, index)}
                  className="block text-left w-full"
                >
                  <h3 className="text-xl text-primary hover:underline cursor-pointer">
                    {result.title}
                  </h3>
                </button>
                <p className="text-sm text-google-text leading-relaxed">
                  {result.snippet}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-google-text-light">
              {searchParams.get("q") ? "No results found" : "Enter a search query to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;