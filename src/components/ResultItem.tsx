import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { trackingAPI } from '@/lib/trackingApi';
import { toast } from "@/hooks/use-toast";

interface ResultItemProps {
  rank: number;
  title: string;
  url: string;
  snippet: string;
  onCopyLink: (url: string) => void;
}

export function ResultItem({ rank, title, url, snippet, onCopyLink }: ResultItemProps) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // Log the click before opening the external tab
      const success = await trackingAPI.logClick(url, rank);
      
      if (success) {
        console.log(`Click logged for rank ${rank}: ${url}`);
      } else {
        console.warn(`Failed to log click for rank ${rank}: ${url}`);
      }
      
      // Always open the link regardless of logging success
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error handling result click:', error);
      // Still open the link even if logging fails
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="py-3 border-b border-gray-200 last:border-b-0">
      <div className="mb-1">
        <a 
          href={url} 
          data-rank={rank} 
          data-url={url}
          onClick={handleClick}
          className="text-lg text-[#1a0dab] hover:underline cursor-pointer"
        >
          {title}
        </a>
      </div>
      <div className="text-sm text-[#006621] mb-1">
        {url}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onCopyLink(url)} 
          className="ml-2 p-1 h-auto text-xs"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
      <div className="text-sm text-[#4d5156]">
        {snippet}
      </div>
    </div>
  );
}