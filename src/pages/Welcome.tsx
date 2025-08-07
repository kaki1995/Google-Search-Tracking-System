import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, Search, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SearchResult {
  rank: number;
  title: string;
  link: string;
  snippet: string;
}

interface SearchHistory {
  query: string;
  timestamp: Date;
  resultsCount: number;
}

export default function Welcome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get or create session ID
      let sessionId = sessionStorage.getItem("session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("session_id", sessionId);
      }

      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId,
          query_text: searchQuery.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.results) {
        setCurrentResults(data.results);
        // Store query_id for click tracking
        sessionStorage.setItem("current_query_id", data.query_id);
        
        const newSearch: SearchHistory = {
          query: searchQuery,
          timestamp: new Date(),
          resultsCount: data.results.length
        };
        setSearchHistory(prev => [...prev, newSearch]);
        
        toast({
          title: "Search completed",
          description: `Found ${data.results.length} results for "${searchQuery}"`
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    try {
      // Log the click
      const queryId = sessionStorage.getItem("current_query_id");
      
      if (queryId) {
        await fetch("/api/log_click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query_id: queryId,
            clicked_url: result.link,
            clicked_rank: result.rank
          })
        });
      }
    } catch (error) {
      console.error("Failed to log click:", error);
    }

    // Open the link in new tab
    window.open(result.link, "_blank");
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Link copied",
        description: "Link has been copied to clipboard"
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive"
      });
    });
  };

  const copyGoogleSearchLink = (query: string) => {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    copyLink(googleUrl);
  };

  const handleFinishTask = () => {
    navigate("/search-result-log");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Google Logo */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl font-normal mb-8">
            <span className="text-blue-600">G</span>
            <span className="text-red-500">o</span>
            <span className="text-yellow-500">o</span>
            <span className="text-blue-600">g</span>
            <span className="text-green-500">l</span>
            <span className="text-red-500">e</span>
          </h1>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Google or type a URL"
                className="w-full h-12 pl-12 pr-4 text-base border-gray-300 rounded-full shadow-sm hover:shadow-md focus:shadow-md transition-shadow duration-200 outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Google Search"
              )}
            </Button>
            <Button
              type="button"
              onClick={handleFinishTask}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Finish Task
            </Button>
          </div>
        </form>

        {/* Search Results */}
        {currentResults.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="space-y-6">
              {currentResults.map((result) => (
                <div key={result.rank} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                  <div className="mb-1">
                    <button
                      onClick={() => handleResultClick(result)}
                      className="text-lg text-blue-800 hover:underline cursor-pointer text-left"
                    >
                      {result.title}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-green-700">{result.link}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(result.link)}
                      className="p-1 h-auto text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Search History</h3>
              <div className="space-y-3">
                {searchHistory.map((search, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{search.query}</p>
                      <p className="text-sm text-gray-600">
                        {search.timestamp.toLocaleTimeString()} - {search.resultsCount} results
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyGoogleSearchLink(search.query)}
                      className="ml-4 text-gray-600 border-gray-300 hover:bg-gray-100"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Google Link
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}