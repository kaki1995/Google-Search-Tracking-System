// Frontend tracking API client - integrated with sessionManager
import { sessionManager } from './sessionManager';

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

export class TrackingAPI {
  private currentQueryId: string | null = null;

  async startSession(participantId: string): Promise<string | null> {
    // Use sessionManager for session handling
    sessionManager.setParticipantId(participantId);
    const sessionId = await sessionManager.ensureSession();
    if (sessionId) {
      localStorage.setItem('tracking_session_id', sessionId);
    }
    return sessionId;
  }

  async startQuery(queryText: string, queryStructure?: string): Promise<string | null> {
    const sessionId = sessionManager.getSessionId();
    if (!sessionId) {
      console.error('No active session for query start');
      return null;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('query-start', {
        body: {
          session_id: sessionId,
          query_text: queryText,
          query_structure: queryStructure
        }
      });

      if (error || !data?.ok) {
        console.error('Failed to start query:', error || data?.error);
        return null;
      }

      this.currentQueryId = data.query_id;
      sessionStorage.setItem('current_query_id', this.currentQueryId);
      return this.currentQueryId;
    } catch (error) {
      console.error('Query start error:', error);
      return null;
    }
  }

  async endQuery(): Promise<boolean> {
    if (!this.currentQueryId) {
      console.error('No active query to end');
      return false;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('query-end', {
        body: { query_id: this.currentQueryId }
      });

      if (error || !data?.ok) {
        console.error('Failed to end query:', error || data?.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Query end error:', error);
      return false;
    }
  }

  async logClick(clickedUrl: string, clickedRank?: number): Promise<boolean> {
    if (!this.currentQueryId) {
      console.error('No active query for click logging');
      return false;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('log-click', {
        body: {
          query_id: this.currentQueryId,
          clicked_url: clickedUrl,
          clicked_rank: clickedRank
        }
      });

      if (error || !data?.ok) {
        console.error('Failed to log click:', error || data?.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Click logging error:', error);
      return false;
    }
  }

  async logScroll(path: string, maxScrollPct: number): Promise<boolean> {
    const sessionId = sessionManager.getSessionId();
    if (!sessionId) {
      console.error('No active session for scroll logging');
      return false;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('log-scroll', {
        body: {
          session_id: sessionId,
          path,
          max_scroll_pct: maxScrollPct
        }
      });

      if (error || !data?.ok) {
        console.error('Failed to log scroll:', error || data?.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Scroll logging error:', error);
      return false;
    }
  }

  async endSession(): Promise<boolean> {
    try {
      const success = await sessionManager.endSession();
      if (success) {
        // Clear tracking session data
        this.currentQueryId = null;
        localStorage.removeItem('tracking_session_id');
        sessionStorage.removeItem('current_query_id');
      }
      return success;
    } catch (error) {
      console.error('Session end error:', error);
      return false;
    }
  }

  // Utility methods
  getSessionId(): string | null {
    return sessionManager.getSessionId() || localStorage.getItem('tracking_session_id');
  }

  getCurrentQueryId(): string | null {
    return this.currentQueryId || sessionStorage.getItem('current_query_id');
  }

  initFromStorage(): void {
    this.currentQueryId = sessionStorage.getItem('current_query_id');
  }
}

export const trackingAPI = new TrackingAPI();