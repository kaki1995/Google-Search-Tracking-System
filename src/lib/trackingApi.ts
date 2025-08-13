// Frontend tracking API client
const BASE_URL = 'https://wbguuipoggeamyzrfvbv.supabase.co/functions/v1';

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

export class TrackingAPI {
  private sessionId: string | null = null;
  private currentQueryId: string | null = null;

  async startSession(participantId: string): Promise<string | null> {
    try {
      const response = await fetch(`${BASE_URL}/session-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY'
        },
        body: JSON.stringify({ participant_id: participantId })
      });

      const data: ApiResponse = await response.json();
      if (data.ok) {
        this.sessionId = data.sessionId;
        localStorage.setItem('tracking_session_id', this.sessionId);
        return this.sessionId;
      } else {
        console.error('Failed to start session:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Session start error:', error);
      return null;
    }
  }

  async startQuery(queryText: string, queryStructure?: string): Promise<string | null> {
    if (!this.sessionId) {
      console.error('No active session for query start');
      return null;
    }

    try {
      const response = await fetch(`${BASE_URL}/query-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY'
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          query_text: queryText,
          query_structure: queryStructure
        })
      });

      const data: ApiResponse = await response.json();
      if (data.ok) {
        this.currentQueryId = data.query_id;
        sessionStorage.setItem('current_query_id', this.currentQueryId);
        return this.currentQueryId;
      } else {
        console.error('Failed to start query:', data.error);
        return null;
      }
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
      const response = await fetch(`${BASE_URL}/query-end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY'
        },
        body: JSON.stringify({ query_id: this.currentQueryId })
      });

      const data: ApiResponse = await response.json();
      if (data.ok) {
        return true;
      } else {
        console.error('Failed to end query:', data.error);
        return false;
      }
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
      const response = await fetch(`${BASE_URL}/log-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY'
        },
        body: JSON.stringify({
          query_id: this.currentQueryId,
          clicked_url: clickedUrl,
          clicked_rank: clickedRank
        })
      });

      const data: ApiResponse = await response.json();
      if (data.ok) {
        return true;
      } else {
        console.error('Failed to log click:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Click logging error:', error);
      return false;
    }
  }

  async logScroll(path: string, maxScrollPct: number): Promise<boolean> {
    if (!this.sessionId) {
      console.error('No active session for scroll logging');
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}/log-scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY'
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          path,
          max_scroll_pct: maxScrollPct
        })
      });

      const data: ApiResponse = await response.json();
      if (data.ok) {
        return true;
      } else {
        console.error('Failed to log scroll:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Scroll logging error:', error);
      return false;
    }
  }

  async endSession(): Promise<boolean> {
    if (!this.sessionId) {
      console.error('No active session to end');
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}/session-end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY'
        },
        body: JSON.stringify({ session_id: this.sessionId })
      });

      const data: ApiResponse = await response.json();
      if (data.ok) {
        // Clear session data
        this.sessionId = null;
        this.currentQueryId = null;
        localStorage.removeItem('tracking_session_id');
        sessionStorage.removeItem('current_query_id');
        return true;
      } else {
        console.error('Failed to end session:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Session end error:', error);
      return false;
    }
  }

  // Utility methods
  getSessionId(): string | null {
    return this.sessionId || localStorage.getItem('tracking_session_id');
  }

  getCurrentQueryId(): string | null {
    return this.currentQueryId || sessionStorage.getItem('current_query_id');
  }

  initFromStorage(): void {
    this.sessionId = localStorage.getItem('tracking_session_id');
    this.currentQueryId = sessionStorage.getItem('current_query_id');
  }
}

export const trackingAPI = new TrackingAPI();