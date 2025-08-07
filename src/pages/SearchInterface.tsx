import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, Search, ArrowRight } from "lucide-react";
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
  results: SearchResult[];
}
export default function SearchInterface() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      try {
        // Get or create session ID
        let sessionId = sessionStorage.getItem("session_id");
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem("session_id", sessionId);
        }
        const response = await fetch("https://wbguuipoggeamyzrfvbv.supabase.co/functions/v1/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            session_id: sessionId,
            query_text: searchQuery
          })
        });
        const data = await response.json();
        if (data.results) {
          setCurrentResults(data.results);
          // Store query_id for click tracking
          sessionStorage.setItem("current_query_id", data.query_id);
          const newSearch = {
            query: searchQuery,
            timestamp: new Date(),
            results: data.results
          };
          setSearchHistory([...searchHistory, newSearch]);
          toast({
            title: "Search completed",
            description: `Found ${data.results.length} results for "${searchQuery}"`
          });
        }
      } catch (error) {
        toast({
          title: "Search failed",
          description: "Unable to perform search. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  const handleResultClick = async (result: SearchResult) => {
    try {
      // Log the click
      const sessionId = sessionStorage.getItem("session_id");
      const queryId = sessionStorage.getItem("current_query_id");
      if (sessionId && queryId) {
        await fetch("https://wbguuipoggeamyzrfvbv.supabase.co/functions/v1/log_click", {
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

    // Open the link
    window.open(result.link, "_blank");
  };
  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard"
    });
  };
  const handleFinishTask = () => {
    navigate("/search-result-log");
  };
  return <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Google Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-border mb-8">
          {/* Google Logo and Search */}
          <div className="flex flex-col items-center pt-16 pb-8">
            <div className="mb-8">
              <span className="text-6xl font-light">
                <span className="text-[#4285f4]">G</span>
                <span className="text-[#ea4335]">o</span>
                <span className="text-[#fbbc04]">o</span>
                <span className="text-[#4285f4]">g</span>
                <span className="text-[#34a853]">l</span>
                <span className="text-[#ea4335]">e</span>
              </span>
            </div>

            {/* Search Box with Inline Buttons */}
            <div className="relative mb-8 w-full max-w-[800px]">
              <div className="flex items-center gap-4">
                {/* Search Input */}
                <div className="flex items-center flex-1 h-[44px] border border-gray-300 rounded-full px-4 shadow-sm hover:shadow-md transition-shadow">
                  <Search className="w-4 h-4 text-gray-400 mr-3" />
                  <Input type="text" className="flex-1 outline-none border-0 bg-transparent" placeholder="Search Google or type a URL" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSearch} disabled={isLoading} className="px-4 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700 hover:shadow-sm hover:border-gray-400">
                    {isLoading ? "Searching..." : "Google Search"}
                  </Button>
                  <Button onClick={handleFinishTask} className="px-4 py-2 flex items-center gap-2 text-white bg-sky-600 hover:bg-sky-500">
                    <ArrowRight className="w-4 h-4" />
                    Finish Task
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {currentResults.length > 0 && <div className="w-full max-w-[700px] mx-auto mb-8">
            {currentResults.map(result => <div key={result.rank} className="py-3 border-b border-gray-200 last:border-b-0">
                <div className="mb-1">
                  <a href="#" onClick={e => {
              e.preventDefault();
              handleResultClick(result);
            }} className="text-lg text-[#1a0dab] hover:underline cursor-pointer">
                    {result.title}
                  </a>
                </div>
                <div className="text-sm text-[#006621] mb-1">
                  {result.link}
                  <Button variant="ghost" size="sm" onClick={() => handleCopyLink(result.link)} className="ml-2 p-1 h-auto text-xs">
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-sm text-[#4d5156]">
                  {result.snippet}
                </div>
              </div>)}
          </div>}

        {/* Search History */}
        {searchHistory.length > 0 && <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Search History</h3>
            <div className="space-y-3">
              {searchHistory.map((search, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{search.query}</p>
                    <p className="text-sm text-muted-foreground">
                      {search.timestamp.toLocaleTimeString()} - {search.results.length} results
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopyLink(`https://www.google.com/search?q=${encodeURIComponent(search.query)}`)} className="ml-4">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>)}
            </div>
          </Card>}
      </div>
    </div>;
}