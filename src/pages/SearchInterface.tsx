import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, Search, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SearchHistory {
  query: string;
  timestamp: Date;
  results: number;
}

export default function SearchInterface() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const newSearch = {
        query: searchQuery,
        timestamp: new Date(),
        results: Math.floor(Math.random() * 10000) + 1000
      };
      setSearchHistory([...searchHistory, newSearch]);
      setSearchQuery("");
      toast({
        title: "Search completed",
        description: `Found ${newSearch.results} results for "${newSearch.query}"`
      });
    }
  };

  const handleCopyLink = (query: string) => {
    const fakeLink = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    navigator.clipboard.writeText(fakeLink);
    toast({
      title: "Link copied",
      description: "Search link has been copied to clipboard"
    });
  };

  const handleFinishTask = () => {
    navigate("/search-result-log");
  };

  return (
    <div className="min-h-screen bg-background p-6">
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

            {/* Search Box */}
            <div className="relative mb-8 w-full max-w-[584px]">
              <div className="flex items-center w-full h-[44px] border border-gray-300 rounded-full px-4 shadow-sm hover:shadow-md transition-shadow">
                <Search className="w-4 h-4 text-gray-400 mr-3" />
                <Input 
                  type="text" 
                  className="flex-1 outline-none border-0 bg-transparent"
                  placeholder="Search Google or type a URL"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="absolute right-2 top-1 h-[36px] px-4 bg-primary hover:bg-primary/90"
              >
                Search
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6">
              <Button 
                variant="outline" 
                onClick={handleSearch}
                className="px-6 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700 hover:shadow-sm hover:border-gray-400"
              >
                Google Search
              </Button>
              <Button 
                onClick={handleFinishTask}
                className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Finish Task
              </Button>
            </div>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Search History</h3>
            <div className="space-y-3">
              {searchHistory.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{search.query}</p>
                    <p className="text-sm text-muted-foreground">
                      {search.timestamp.toLocaleTimeString()} - {search.results.toLocaleString()} results
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(search.query)}
                    className="ml-4"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}