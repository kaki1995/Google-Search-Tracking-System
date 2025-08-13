import { useEffect, useRef } from 'react';
import { trackingAPI } from '@/lib/trackingApi';

export function useScrollTracking(path: string = '/') {
  const maxScrollRef = useRef(0);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let maxPct = 0;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = Math.max(
        document.body.scrollHeight, 
        document.documentElement.scrollHeight
      );
      const viewportHeight = window.innerHeight;
      const scrollPercent = Math.round((scrollTop / Math.max(1, docHeight - viewportHeight)) * 100);
      
      const clampedPercent = Math.max(0, Math.min(100, scrollPercent));
      maxPct = Math.max(maxPct, clampedPercent);
      maxScrollRef.current = maxPct;
    };

    const flush = () => {
      if (maxScrollRef.current > 0) {
        trackingAPI.logScroll(path, maxScrollRef.current)
          .catch(error => console.error('Failed to log scroll:', error));
      }
    };

    const debouncedFlush = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flush, 1000);
    };

    // Event listeners
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', debouncedFlush, { passive: true });
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', debouncedFlush);
      window.removeEventListener('beforeunload', flush);
      clearTimeout(debounceRef.current);
      // Final flush on cleanup
      flush();
    };
  }, [path]);
}

export function initScrollTracking(sessionId: string, path: string) {
  let maxPct = 0;
  
  const onScroll = () => {
    const st = window.scrollY;
    const doc = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const vp = window.innerHeight;
    const pct = Math.round((st / Math.max(1, doc - vp)) * 100);
    maxPct = Math.max(maxPct, Math.min(100, Math.max(0, pct)));
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });

  const flush = () => {
    if (maxPct > 0) {
      const data = JSON.stringify({ session_id: sessionId, path, max_scroll_pct: maxPct });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/scroll', new Blob([data], { type: 'application/json' }));
      } else {
        // Fallback for browsers without sendBeacon
        trackingAPI.logScroll(path, maxPct).catch(console.error);
      }
    }
  };
  
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => { 
    if (document.visibilityState === 'hidden') flush(); 
  });

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('beforeunload', flush);
    flush();
  };
}