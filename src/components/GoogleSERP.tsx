import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackingAPI } from "@/lib/trackingApi";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { performGoogleSearch } from "@/lib/googleSearch";

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  pagemap?: {
    cse_thumbnail?: Array<{ src: string; width: string; height: string }>;
    cse_image?: Array<{ src: string }>;
    aggregaterating?: Array<{ ratingvalue: string; ratingcount: string }>;
    videoobject?: Array<{ name: string; duration: string }>;
  };
  sitelinks?: {
    inline?: Array<{ title: string; link: string }>;
  };
}

interface SearchResult {
  rank: number;
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  thumbnail?: string;
  rating?: { value: string; count: string };
  hasVideo?: boolean;
  sitelinks?: Array<{ title: string; link: string }>;
}

interface PaginationState {
  currentPage: number;
  totalResults: number;
  hasNextPage: boolean;
  nextStartIndex?: number;
  searchTime: number;
}

const GoogleSERP = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalResults: 0,
    hasNextPage: false,
    searchTime: 0
  });

  useScrollTracking(window.location.pathname);

  useEffect(() => {
    trackingAPI.initFromStorage();
    
    const participantId = localStorage.getItem('participant_id');
    if (participantId && !trackingAPI.getSessionId()) {
      trackingAPI.startSession(participantId)
        .then(sessionId => {
          if (sessionId) {
            console.log('Tracking session initialized:', sessionId);
          }
        })
        .catch(error => console.error('Session initialization error:', error));
    }
  }, []);

  const dispatchSERPEvent = (eventType: string, data: any) => {
    window.dispatchEvent(new CustomEvent('serp:click', {
      detail: {
        query: currentQuery,
        ...data,
        timestamp: Date.now()
      }
    }));
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatSearchTime = (seconds: number): string => {
    return seconds.toFixed(2);
  };

  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getFaviconUrl = (url: string): string => {
    const domain = extractDomain(url);
    return `https://www.google.com/s2/favicons?domain=${domain}`;
  };

  const convertGoogleResults = (items: GoogleSearchResult[], startIndex: number): SearchResult[] => {
    return items.map((item, index) => ({
      rank: startIndex + index,
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || item.pagemap?.cse_image?.[0]?.src,
      rating: item.pagemap?.aggregaterating?.[0] ? {
        value: item.pagemap.aggregaterating[0].ratingvalue,
        count: item.pagemap.aggregaterating[0].ratingcount
      } : undefined,
      hasVideo: !!item.pagemap?.videoobject,
      sitelinks: item.sitelinks?.inline
    }));
  };

  const handleSearch = async (startIndex: number = 1) => {
    const queryToSearch = startIndex === 1 ? searchQuery.trim() : currentQuery;
    
    if (!queryToSearch) return;

    setIsLoading(true);
    const searchStartTime = Date.now();

    try {
      if (startIndex === 1) {
        const queryStructure = classifyQuery(queryToSearch);
        const queryId = await trackingAPI.startQuery(queryToSearch, queryStructure);
        if (!queryId) {
          console.error('Failed to start query tracking');
        }
        setCurrentQuery(queryToSearch);
        
        dispatchSERPEvent('query_submit', { query: queryToSearch });
      }

      const searchResult = await performGoogleSearch(queryToSearch, startIndex);
      const searchTime = (Date.now() - searchStartTime) / 1000;

      if (startIndex === 1) {
        await trackingAPI.endQuery();
      }

      const searchResults = convertGoogleResults(searchResult.results, startIndex);
      setCurrentResults(searchResults);
      
      setPagination({
        currentPage: Math.floor((startIndex - 1) / 10) + 1,
        totalResults: searchResult.totalResults,
        hasNextPage: searchResult.hasNextPage,
        nextStartIndex: searchResult.nextStartIndex,
        searchTime
      });

      toast({
        title: "Search completed",
        description: `Found ${formatNumber(searchResult.totalResults)} results in ${formatSearchTime(searchTime)} seconds`
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const classifyQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (/^(how|what|when|where|why|who)/.test(lowerQuery)) {
      return 'question';
    } else if (/\b(vs|versus|compare|better|best|worse)\b/.test(lowerQuery)) {
      return 'comparative';
    } else {
      return 'keyword';
    }
  };

  const handleResultClick = (result: SearchResult, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    trackingAPI.logClick(result.link, result.rank);
    dispatchSERPEvent('result_click', { 
      link: result.link, 
      rank: result.rank, 
      title: result.title 
    });
    
    window.open(result.link, '_blank', 'noopener,noreferrer');
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage && pagination.nextStartIndex) {
      dispatchSERPEvent('pagination', { action: 'next', page: pagination.currentPage + 1 });
      handleSearch(pagination.nextStartIndex);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      const previousStartIndex = (pagination.currentPage - 2) * 10 + 1;
      dispatchSERPEvent('pagination', { action: 'previous', page: pagination.currentPage - 1 });
      handleSearch(previousStartIndex);
    }
  };

  const handleFinishTask = async () => {
    await trackingAPI.endSession();
    navigate("/search-result-log");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with search box */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-[700px] mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Google Logo (smaller) */}
            <img 
              src="/lovable-uploads/35f40ea1-5551-4fc9-a6b3-d7ef526bef72.png" 
              alt="Google" 
              className="h-8 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
            
            {/* Search Box */}
            <div className="flex-1 max-w-[584px]">
              <div className="flex items-center h-11 border border-gray-300 rounded-full px-4 hover:shadow-md transition-shadow bg-white">
                <Input 
                  type="text" 
                  className="flex-1 outline-none border-0 bg-transparent text-base px-2" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
                />
                <div className="border-l border-gray-300 h-6 mx-3"></div>
                <Search className="w-4 h-4 text-blue-500 cursor-pointer" onClick={() => handleSearch(1)} />
              </div>
            </div>
            
            <Button onClick={handleFinishTask} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm">
              Finish Task
            </Button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 mt-4 text-sm">
            <span className="text-blue-600 border-b-2 border-blue-600 pb-3 cursor-pointer">All</span>
            <span className="text-gray-600 hover:text-gray-900 cursor-pointer pb-3">Images</span>
            <span className="text-gray-600 hover:text-gray-900 cursor-pointer pb-3">Videos</span>
            <span className="text-gray-600 hover:text-gray-900 cursor-pointer pb-3">News</span>
            <span className="text-gray-600 hover:text-gray-900 cursor-pointer pb-3">More</span>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-[700px] mx-auto px-4 py-4">
        {/* Results Meta Info */}
        {currentResults.length > 0 && (
          <div className="text-sm text-gray-600 mb-6">
            About {formatNumber(pagination.totalResults)} results ({formatSearchTime(pagination.searchTime)} seconds)
          </div>
        )}

        {/* Results List */}
        <div className="space-y-6">
          {currentResults.map((result) => (
            <div key={result.rank} className="group">
              <div className="flex gap-4">
                <div className="flex-1">
                  {/* URL/Breadcrumb with favicon */}
                  <div className="flex items-center gap-2 mb-1">
                    <img 
                      src={getFaviconUrl(result.link)} 
                      alt="" 
                      className="w-4 h-4"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm text-green-700">{result.displayLink}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="mb-1">
                    <a 
                      href={result.link}
                      onClick={(e) => handleResultClick(result, e)}
                      className="text-xl text-blue-600 hover:underline cursor-pointer visited:text-purple-600"
                    >
                      {result.title}
                    </a>
                    {result.hasVideo && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                        Video
                      </span>
                    )}
                  </h3>
                  
                  {/* Rating */}
                  {result.rating && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-orange-400">★</span>
                      <span className="text-sm text-gray-600">
                        {result.rating.value} ({result.rating.count})
                      </span>
                    </div>
                  )}
                  
                  {/* Snippet */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {result.snippet}
                  </p>
                  
                  {/* Sitelinks */}
                  {result.sitelinks && result.sitelinks.length > 0 && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {result.sitelinks.slice(0, 4).map((sitelink, index) => (
                        <a 
                          key={index}
                          href={sitelink.link}
                          onClick={(e) => handleResultClick({...result, link: sitelink.link, title: sitelink.title}, e)}
                          className="text-blue-600 hover:underline"
                        >
                          {sitelink.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail */}
                {result.thumbnail && (
                  <div className="hidden sm:block flex-shrink-0">
                    <img 
                      src={result.thumbnail} 
                      alt=""
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {currentResults.length > 0 && (
          <div className="flex items-center justify-center gap-8 mt-8 pt-6">
            <Button
              variant="ghost"
              onClick={handlePreviousPage}
              disabled={pagination.currentPage <= 1 || isLoading}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage}
            </span>
            
            <Button
              variant="ghost"
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage || isLoading}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="text-gray-600">Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSERP;