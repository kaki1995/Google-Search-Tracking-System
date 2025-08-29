import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
    // Always prevent default and open in new tab
    if (event) {
      event.preventDefault();
    }
    
    // Log the click for tracking
    trackingAPI.logClick(result.link, result.rank);
    dispatchSERPEvent('result_click', { 
      link: result.link, 
      rank: result.rank, 
      title: result.title 
    });
    
    // Always open in new tab
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
      {currentResults.length === 0 ? (
        // Google Homepage Layout
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          {/* Google Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <svg width="272" height="92" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                  <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                  <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
                  <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
                  <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
                  <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
                  <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
                </g>
              </svg>
            </div>
          </div>
          
          {/* Search Box */}
          <div className="w-full max-w-[584px] mb-8">
            <div className="flex items-center h-12 border border-gray-300 rounded-full px-4 hover:shadow-md transition-shadow bg-white">
              <Input 
                type="text" 
                className="flex-1 outline-none border-0 bg-transparent text-base px-2" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch(1)}
                placeholder=""
                disabled={isLoading}
              />
              <div className="flex items-center gap-3 ml-3">
                <svg className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill="currentColor"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="currentColor"/>
                </svg>
                <svg className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Google Search Button */}
          <div className="flex justify-center mb-12">
            <Button 
              onClick={() => handleSearch(1)}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium bg-gray-50 border border-gray-300 rounded hover:shadow-sm hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Start Search"
              )}
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-20 mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/task-instructions')} 
              className="px-8 py-2 text-sm font-medium border-2 rounded-full"
            >
              Previous Page
            </Button>
            <Button 
              onClick={handleFinishTask} 
              className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full"
            >
              Next Page
            </Button>
          </div>
        </div>
      ) : (
        // Search Results Layout
        <>
          {/* Header with search box */}
          <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="max-w-[700px] mx-auto px-4 py-3">
              <div className="flex items-center gap-4">
                {/* Google Logo (smaller) */}
                <div 
                  className="cursor-pointer"
                  onClick={() => {
                    setCurrentResults([]);
                    setSearchQuery("");
                    setCurrentQuery("");
                  }}
                >
                  <svg width="92" height="30" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fillRule="evenodd">
                      <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                      <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
                      <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
                      <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
                      <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
                      <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
                    </g>
                  </svg>
                </div>
                
                {/* Search Box */}
                <div className="flex-1 max-w-[584px]">
                  <div className="flex items-center h-11 border border-gray-300 rounded-full px-4 hover:shadow-md transition-shadow bg-white">
                    <Input 
                      type="text" 
                      className="flex-1 outline-none border-0 bg-transparent text-base px-2" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch(1)}
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-3 ml-3">
                      <svg className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill="currentColor"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="currentColor"/>
                      </svg>
                      <svg className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" fill="currentColor"/>
                      </svg>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 text-blue-500 cursor-pointer" onClick={() => handleSearch(1)} />
                      )}
                    </div>
                  </div>
                </div>
                
              </div>
              
              {/* Previous Page and Finish Task Buttons */}
              <div className="flex justify-between mt-4 mb-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/task-instructions')} 
                  className="px-8 py-2 text-sm font-medium border-2"
                >
                  Previous Page
                </Button>
                <Button 
                  onClick={handleFinishTask} 
                  className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
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
            {!isLoading && (
              <div className="text-sm text-gray-600 mb-6">
                About {formatNumber(pagination.totalResults)} results ({formatSearchTime(pagination.searchTime)} seconds)
              </div>
            )}

            {/* Loading Spinner */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            )}

            {/* Results List */}
            {!isLoading && (
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
            )}

            {/* Pagination */}
            {!isLoading && (
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
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleSERP;