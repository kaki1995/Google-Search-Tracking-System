import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, Search, ArrowRight, ChevronLeft, ChevronRight, Mic, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackingService } from "@/lib/tracking";
import { performGoogleSearch, performGoogleSearchLegacy } from "@/lib/googleSearch";

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
  totalResults: number;
}

interface PaginationState {
  currentPage: number;
  totalResults: number;
  hasNextPage: boolean;
  nextStartIndex?: number;
  resultsPerPage: number;
}
export default function SearchInterface() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalResults: 0,
    hasNextPage: false,
    resultsPerPage: 10
  });
  const [currentQuery, setCurrentQuery] = useState("");

  const handleSearch = async (startIndex: number = 1) => {
    const queryToSearch = startIndex === 1 ? searchQuery.trim() : currentQuery;
    
    if (queryToSearch) {
      setIsLoading(true);
      try {
        console.log('Starting search for:', queryToSearch, 'at start index:', startIndex);
        
        // Ensure tracking session exists
        let session = trackingService.getSessionData();
        if (!session) {
          console.log('No tracking session found, initializing...');
          await trackingService.initSession();
          session = trackingService.getSessionData();
        }
        
        if (!session) {
          throw new Error('Failed to initialize tracking session');
        }
        
        console.log('Using tracking session:', session.sessionId);

        // Perform Google search using client-side API with pagination
        const searchResult = await performGoogleSearch(queryToSearch, startIndex);
        console.log('Google search results:', searchResult);

        if (searchResult.results.length === 0) {
          throw new Error('No search results found');
        }

        // Track the query using the tracking service (only for new searches)
        let queryId = sessionStorage.getItem("current_query_id");
        if (startIndex === 1) {
          queryId = await trackingService.trackQuery(queryToSearch, searchResult.totalResults);
          console.log('Query tracked with ID:', queryId);
          sessionStorage.setItem("current_query_id", queryId || '');
          setCurrentQuery(queryToSearch);
        }

        // Convert Google results to our format with proper ranking for pagination
        const baseRank = startIndex - 1;
        const searchResults = searchResult.results.map((item, index) => ({
          rank: baseRank + index + 1,
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }));

        // For new searches, replace results. For pagination, we might want to append or replace
        if (startIndex === 1) {
          setCurrentResults(searchResults);
          
          // Add to search history only for new searches
          const newSearch: SearchHistory = {
            query: queryToSearch,
            timestamp: new Date(),
            results: searchResults,
            totalResults: searchResult.totalResults
          };
          setSearchHistory([...searchHistory, newSearch]);
        } else {
          // For pagination, replace current results with new page
          setCurrentResults(searchResults);
        }
        
        // Update pagination state
        setPagination({
          currentPage: Math.floor((startIndex - 1) / 10) + 1,
          totalResults: searchResult.totalResults,
          hasNextPage: searchResult.hasNextPage,
          nextStartIndex: searchResult.nextStartIndex,
          resultsPerPage: 10
        });

        sessionStorage.setItem("session_id", session.sessionId);
        
        toast({
          title: "Search completed",
          description: `Found ${searchResult.totalResults} total results for "${queryToSearch}" (showing ${searchResults.length} on this page)`
        });
        
        console.log('Search completed successfully');
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: "Search failed",
          description: error instanceof Error ? error.message : "Unable to perform search. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [showingAllResults, setShowingAllResults] = useState(false);

  const loadMoreResults = async () => {
    if (!currentQuery) return;
    
    setIsLoading(true);
    try {
      // Load multiple pages of results (up to 100 total from Google)
      const allResultsArray: SearchResult[] = [...currentResults];
      let startIndex = pagination.nextStartIndex || 11;
      
      // Load remaining pages (Google Custom Search allows up to 100 results)
      while (startIndex <= 100 && allResultsArray.length < 100) {
        const searchResult = await performGoogleSearch(currentQuery, startIndex);
        
        if (searchResult.results.length === 0) break;
        
        const baseRank = startIndex - 1;
        const newResults = searchResult.results.map((item, index) => ({
          rank: baseRank + index + 1,
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }));
        
        allResultsArray.push(...newResults);
        
        if (!searchResult.hasNextPage) break;
        startIndex = searchResult.nextStartIndex || startIndex + 10;
      }
      
      setAllResults(allResultsArray);
      setCurrentResults(allResultsArray);
      setShowingAllResults(true);
      
      toast({
        title: "All results loaded",
        description: `Now showing ${allResultsArray.length} results for "${currentQuery}"`
      });
      
    } catch (error) {
      console.error('Error loading more results:', error);
      toast({
        title: "Failed to load more results",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setShowingAllResults(false);
    setAllResults([]);
    handleSearch(1);
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage && pagination.nextStartIndex) {
      handleSearch(pagination.nextStartIndex);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      const previousStartIndex = (pagination.currentPage - 2) * pagination.resultsPerPage + 1;
      handleSearch(previousStartIndex);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    try {
      // Get current query ID and session
      const queryId = sessionStorage.getItem("current_query_id");
      
      console.log('Logging click:', {
        queryId,
        url: result.link,
        rank: result.rank
      });

      // Track the click using the tracking service
      if (queryId) {
        await trackingService.trackClickWithDetails(result.link, result.title, result.rank, queryId);
        console.log('Click tracked successfully');
      } else {
        console.warn('No query ID available for click tracking');
      }
    } catch (error) {
      console.error("Failed to log click:", error);
    }

    // SECURITY: Open link with security attributes
    window.open(result.link, "_blank", "noopener,noreferrer");
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
  const handleLuckySearch = () => {
    if (searchQuery.trim()) {
      // For "I'm Feeling Lucky", we'll do a search and navigate directly to the first result
      handleNewSearch();
    }
  };
  return <div className="min-h-screen bg-white p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Google Interface */}
        <div className="mb-8">
          {/* Google Logo and Search */}
          <div className="flex flex-col items-center pt-16 pb-8">
            <div className="mb-8">
              <img 
                src="/lovable-uploads/35f40ea1-5551-4fc9-a6b3-d7ef526bef72.png" 
                alt="Google" 
                className="w-[420px] h-[142px] object-contain"
              />
            </div>

            {/* Search Box */}
            <div className="relative mb-8 w-full max-w-[720px]">
              <div className="flex items-center h-[56px] border border-[#dfe1e5] rounded-full px-6 hover:shadow-md transition-shadow bg-white">
                <Search className="w-4 h-4 text-[#9aa0a6] mr-3" />
                <Input 
                  type="text" 
                  className="flex-1 outline-none border-0 bg-transparent text-base" 
                  placeholder="" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleNewSearch()} 
                />
                <div className="flex items-center gap-3 ml-3">
                  <Mic className="w-4 h-4 text-[#9aa0a6] cursor-pointer hover:text-[#4285f4]" />
                  <Camera className="w-4 h-4 text-[#9aa0a6] cursor-pointer hover:text-[#4285f4]" />
                </div>
              </div>
              
              {/* Google Search Buttons */}
              <div className="flex justify-center gap-4 pt-6 pb-4">
                <Button 
                  type="button" 
                  onClick={handleNewSearch} 
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#f8f9fa] hover:bg-[#f1f3f4] text-[#3c4043] border border-[#f8f9fa] hover:border-[#dadce0] rounded text-sm font-normal shadow-sm hover:shadow-md transition-all"
                >
                  {isLoading ? "Searching..." : "Google Search"}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleLuckySearch} 
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#f8f9fa] hover:bg-[#f1f3f4] text-[#3c4043] border border-[#f8f9fa] hover:border-[#dadce0] rounded text-sm font-normal shadow-sm hover:shadow-md transition-all"
                >
                  I'm Feeling Lucky
                </Button>
              </div>
              
              {/* Navigation Buttons Below Search Box */}
              <div className="flex justify-between pt-8 px-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/task-instructions')} 
                  className="px-8 py-2 text-sm font-medium border-2"
                >
                  Previous Page
                </Button>
                <Button 
                  type="button" 
                  onClick={handleFinishTask} 
                  className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Finish Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {currentResults.length > 0 && <div className="w-full max-w-[700px] mx-auto mb-8">
            {/* Results Info */}
            <div className="mb-4 text-sm text-gray-600">
              {pagination.totalResults > 0 && (
                <span>
                  About {pagination.totalResults.toLocaleString()} results 
                  {currentQuery && ` for "${currentQuery}"`}
                  {pagination.currentPage > 1 && ` (Page ${pagination.currentPage})`}
                </span>
              )}
            </div>

            {/* Results List */}
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

            {/* Pagination Controls */}
            {pagination.totalResults > pagination.resultsPerPage && (
              <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                {/* Regular Pagination */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={pagination.currentPage <= 1 || isLoading || showingAllResults}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {pagination.currentPage}
                    {showingAllResults && " (All Results Loaded)"}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!pagination.hasNextPage || isLoading || showingAllResults}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Load All Results Button */}
                {!showingAllResults && pagination.hasNextPage && (
                  <Button
                    variant="default"
                    onClick={loadMoreResults}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? "Loading..." : "Load All Available Results"}
                  </Button>
                )}

                {showingAllResults && (
                  <p className="text-sm text-gray-500">
                    Showing all {currentResults.length} available results
                  </p>
                )}
              </div>
            )}
          </div>}

        {/* Search History */}
        {searchHistory.length > 0 && <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Search History</h3>
            <div className="space-y-3">
              {searchHistory.map((search, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{search.query}</p>
                    <p className="text-sm text-muted-foreground">
                      {search.timestamp.toLocaleTimeString()} - {search.totalResults.toLocaleString()} total results
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