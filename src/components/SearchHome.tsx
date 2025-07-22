import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SearchHome = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLuckySearch = () => {
    if (query.trim()) {
      // For "I'm Feeling Lucky", we'll just do a regular search for now
      navigate(`/search?q=${encodeURIComponent(query.trim())}&lucky=true`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Google Logo */}
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-normal">
            <span className="text-google-blue">G</span>
            <span className="text-destructive">o</span>
            <span className="text-yellow-500">o</span>
            <span className="text-google-blue">g</span>
            <span className="text-green-500">l</span>
            <span className="text-destructive">e</span>
          </h1>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-google-text-light">
              <Search className="h-5 w-5" />
            </div>
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Google or type a URL"
              className="w-full h-12 pl-12 pr-12 text-base border-border rounded-full shadow-search hover:shadow-lg focus:shadow-lg transition-shadow duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-google-text-light hover:text-google-text transition-colors"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              type="submit"
              variant="secondary"
              className="px-6 py-2 bg-google-gray hover:bg-border text-google-text border-border"
            >
              Google Search
            </Button>
            <Button
              type="button"
              onClick={handleLuckySearch}
              variant="secondary"
              className="px-6 py-2 bg-google-gray hover:bg-border text-google-text border-border"
            >
              I'm Feeling Lucky
            </Button>
          </div>
        </form>

        {/* Language Links */}
        <div className="text-center text-sm text-google-text-light">
          Google available in:{" "}
          <a href="#" className="text-primary hover:underline">
            Español
          </a>{" "}
          <a href="#" className="text-primary hover:underline">
            Français
          </a>{" "}
          <a href="#" className="text-primary hover:underline">
            Deutsch
          </a>{" "}
          <a href="#" className="text-primary hover:underline">
            Italiano
          </a>{" "}
          <a href="#" className="text-primary hover:underline">
            Português
          </a>{" "}
          <a href="#" className="text-primary hover:underline">
            中文
          </a>{" "}
          <a href="#" className="text-primary hover:underline">
            日本語
          </a>{" "}
          <a href="#" className="text-primary hover:underline">
            한국어
          </a>
        </div>
      </div>
    </div>
  );
};

export default SearchHome;