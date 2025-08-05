import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface TrackingEvent {
  type: 'query' | 'click' | 'scroll' | 'mouse_move' | 'consent' | 'survey' | 'decision';
  timestamp: number;
  data: any;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    isMobile: boolean;
  };
  consentGiven: boolean;
  backgroundSurvey?: any;
  searchPhase: {
    queries: Array<{
      query: string;
      timestamp: number;
      resultsCount: number;
    }>;
    clicks: Array<{
      url: string;
      title: string;
      position: number;
      timestamp: number;
    }>;
    scrollEvents: Array<{
      scrollY: number;
      timestamp: number;
    }>;
  };
  postTaskSurvey?: any;
  finalDecision?: any;
  events: TrackingEvent[];
  startTime: number;
  endTime?: number;
}

class TrackingService {
  private sessionData: SessionData | null = null;
  private isTracking = false;

  async initSession(token?: string): Promise<string> {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('user') || token;
    const sessionId = uuidv4();
    
    this.sessionData = {
      sessionId,
      userId: userIdFromUrl || sessionId,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      },
      consentGiven: false,
      searchPhase: {
        queries: [],
        clicks: [],
        scrollEvents: []
      },
      events: [],
      startTime: Date.now()
    };

    // Save to localStorage for session recovery
    localStorage.setItem('research_session', JSON.stringify(this.sessionData));
    
    // Initialize session in Supabase
    await this.saveToSupabase();
    
    return sessionId;
  }

  loadSession(): SessionData | null {
    const saved = localStorage.getItem('research_session');
    if (saved) {
      this.sessionData = JSON.parse(saved);
      return this.sessionData;
    }
    return null;
  }

  async trackEvent(event: TrackingEvent): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.events.push(event);
    
    // Update localStorage
    localStorage.setItem('research_session', JSON.stringify(this.sessionData));

    // Save to Supabase
    try {
      await this.saveToSupabase();
    } catch (error) {
      console.error('Failed to save tracking data:', error);
    }
  }

  async trackConsent(given: boolean, details?: any): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.consentGiven = given;
    await this.trackEvent({
      type: 'consent',
      timestamp: Date.now(),
      data: { given, details }
    });
  }

  async trackQuery(query: string, resultsCount: number): Promise<string | null> {
    if (!this.sessionData) return null;

    const queryData = {
      query,
      timestamp: Date.now(),
      resultsCount
    };

    this.sessionData.searchPhase.queries.push(queryData);
    
    await this.trackEvent({
      type: 'query',
      timestamp: Date.now(),
      data: queryData
    });

    // Log to queries table
    try {
      const { data, error } = await supabase
        .from('queries')
        .insert({
          session_id: this.sessionData.sessionId,
          query_text: query,
          search_results: [],
          query_reformulation: this.isQueryReformulation(query)
        })
        .select('query_id')
        .single();

      if (error) {
        console.error('Failed to log query to Supabase:', error);
        return null;
      }

      return data.query_id;
    } catch (error) {
      console.error('Failed to log query to Supabase:', error);
      return null;
    }
  }

  async trackClick(url: string, title: string, position: number, queryId?: string): Promise<void> {
    if (!this.sessionData) return;

    const clickData = {
      url,
      title,
      position,
      timestamp: Date.now()
    };

    this.sessionData.searchPhase.clicks.push(clickData);
    
    await this.trackEvent({
      type: 'click',
      timestamp: Date.now(),
      data: clickData
    });

    // Update queries table if queryId provided
    if (queryId) {
      try {
        const { error } = await supabase
          .from('queries')
          .update({
            clicked_url: url,
            clicked_rank: position
          })
          .eq('query_id', queryId);

        if (error) {
          console.error('Failed to log click to Supabase:', error);
        }
      } catch (error) {
        console.error('Failed to log click to Supabase:', error);
      }
    }
  }

  async trackScroll(scrollY: number): Promise<void> {
    if (!this.sessionData) return;

    const scrollData = {
      scrollY,
      timestamp: Date.now()
    };

    this.sessionData.searchPhase.scrollEvents.push(scrollData);
    
    await this.trackEvent({
      type: 'scroll',
      timestamp: Date.now(),
      data: scrollData
    });
  }

  async trackBackgroundSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.backgroundSurvey = surveyData;
    
    await this.trackEvent({
      type: 'survey',
      timestamp: Date.now(),
      data: { type: 'background', ...surveyData }
    });
  }

  async trackPostTaskSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.postTaskSurvey = surveyData;
    
    await this.trackEvent({
      type: 'survey',
      timestamp: Date.now(),
      data: { type: 'post_task', ...surveyData }
    });
  }

  async trackFinalDecision(decision: any): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.finalDecision = decision;
    this.sessionData.endTime = Date.now();
    
    await this.trackEvent({
      type: 'decision',
      timestamp: Date.now(),
      data: decision
    });
  }

  async updateSearchExperience1(data: any): Promise<void> {
    if (!this.sessionData) return;
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          search_experience_log_1: data
        })
        .eq('session_id', this.sessionData.sessionId);

      if (error) {
        console.error('Failed to update search experience log 1:', error);
      }
    } catch (error) {
      console.error('Failed to update search experience log 1:', error);
    }
  }

  async updateSearchExperience2(data: any): Promise<void> {
    if (!this.sessionData) return;
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          search_experience_log_2: data
        })
        .eq('session_id', this.sessionData.sessionId);

      if (error) {
        console.error('Failed to update search experience log 2:', error);
      }
    } catch (error) {
      console.error('Failed to update search experience log 2:', error);
    }
  }

  async markCompleted(): Promise<void> {
    if (!this.sessionData) return;
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          completed: true
        })
        .eq('session_id', this.sessionData.sessionId);

      if (error) {
        console.error('Failed to mark session as completed:', error);
      }
    } catch (error) {
      console.error('Failed to mark session as completed:', error);
    }
  }

  async markExitedEarly(): Promise<void> {
    if (!this.sessionData) return;
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          exited_early: true
        })
        .eq('session_id', this.sessionData.sessionId);

      if (error) {
        console.error('Failed to mark session as exited early:', error);
      }
    } catch (error) {
      console.error('Failed to mark session as exited early:', error);
    }
  }

  startScrollTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    let lastScrollTime = 0;
    
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime > 100) { // Throttle to every 100ms
        this.trackScroll(window.scrollY);
        lastScrollTime = now;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  stopScrollTracking(): void {
    this.isTracking = false;
  }

  private async saveToSupabase(): Promise<void> {
    if (!this.sessionData) return;

    try {
      const deviceType = this.sessionData.deviceInfo.isMobile ? 'mobile' : 'desktop';
      
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          session_id: this.sessionData.sessionId,
          user_id: this.sessionData.userId,
          device_type: deviceType,
          consent_given: this.sessionData.consentGiven,
          consent_timestamp: this.sessionData.consentGiven ? new Date().toISOString() : null,
          background_survey: this.sessionData.backgroundSurvey,
          search_experience_log_1: null,
          search_experience_log_2: this.sessionData.postTaskSurvey,
          final_choice_url: this.sessionData.finalDecision?.url,
          decision_confidence: this.sessionData.finalDecision?.confidence,
          completed: false,
          exited_early: false
        });

      if (error) {
        console.error('Failed to save session data to Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to save session data to Supabase:', error);
    }
  }

  private isQueryReformulation(queryText: string): boolean {
    const previousQueries = this.sessionData?.searchPhase.queries || [];
    if (previousQueries.length === 0) return false;
    
    const lastQuery = previousQueries[previousQueries.length - 1];
    return lastQuery.query !== queryText;
  }

  getSessionData(): SessionData | null {
    return this.sessionData;
  }

  clearSession(): void {
    this.sessionData = null;
    localStorage.removeItem('research_session');
  }
}

export const trackingService = new TrackingService();