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

    // Log to experiment_queries table
    try {
      console.log('Inserting query to experiment_queries:', {
        session_id: this.sessionData.sessionId,
        query_text: query,
        reformulation_count: this.isQueryReformulation(query) ? 1 : 0
      });

      const { data, error } = await supabase
        .from('experiment_queries')
        .insert({
          session_id: this.sessionData.sessionId,
          query_text: query,
          reformulation_count: this.isQueryReformulation(query) ? 1 : 0
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log query to Supabase:', error);
        return null;
      }

      console.log('Query logged successfully with ID:', data.id);
      return data.id;
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

    // Log to interactions table if queryId provided
    if (queryId) {
      try {
        console.log('Inserting click to interactions:', {
          query_id: queryId,
          clicked_url: url,
          clicked_rank: position,
          clicked_result_count: 1
        });

        const { data, error } = await supabase
          .from('interactions')
          .insert({
            query_id: queryId,
            clicked_url: url,
            clicked_rank: position,
            clicked_result_count: 1
          })
          .select('id')
          .single();

        if (error) {
          console.error('Failed to log click to Supabase:', error);
        } else {
          console.log('Click logged successfully with ID:', data.id);
        }
      } catch (error) {
        console.error('Failed to log click to Supabase:', error);
      }
    } else {
      console.warn('No queryId provided for click tracking');
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
    
    console.log('Tracking background survey for session:', this.sessionData.sessionId);
    console.log('Survey data:', surveyData);
    
    // Save directly to background_surveys table
    try {
      const insertData = {
        session_id: this.sessionData.sessionId,
        age_group: surveyData.age,
        gender: surveyData.gender,
        education: surveyData.education,
        country: surveyData.country,
        native_language: surveyData.language,
        shopping_experience: parseInt(surveyData.experience_scale_q7),
        product_research_familiarity: parseInt(surveyData.familiarity_scale_q8),
        google_search_frequency: surveyData.search_frequency
      };
      
      console.log('Inserting to background_surveys:', insertData);
      
      const { data, error } = await supabase
        .from('background_surveys')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save background survey:', error);
      } else {
        console.log('Background survey saved successfully:', data);
      }
    } catch (error) {
      console.error('Failed to save background survey:', error);
    }
    
    await this.trackEvent({
      type: 'survey',
      timestamp: Date.now(),
      data: { type: 'background', ...surveyData }
    });
  }

  async trackPostTaskSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.postTaskSurvey = surveyData;
    
    console.log('Tracking post-task survey for session:', this.sessionData.sessionId);
    console.log('Post-task survey data:', surveyData);
    
    // Save directly to post_survey table
    try {
      const insertData = {
        session_id: this.sessionData.sessionId,
        interface_familiarity: parseInt(surveyData.search_familiarity) || null,
        interface_confidence: parseInt(surveyData.search_confidence) || null,
        search_satisfaction: parseInt(surveyData.search_satisfaction) || null,
        information_efficiency: parseInt(surveyData.search_efficiency) || null,
        interface_ease_of_use: parseInt(surveyData.search_ease) || null,
        interface_usefulness: parseInt(surveyData.search_usefulness) || null,
        decision_support: parseInt(surveyData.search_support) || null,
        interface_learnability: parseInt(surveyData.search_system_ease) || null,
        interface_reuse_likelihood: parseInt(surveyData.search_again) || null,
        search_enjoyment: surveyData.search_enjoyable,
        interface_comparison_rating: surveyData.search_preference,
        // Additional fields that might be in the form
        smartphone_model: surveyData.smartphone_model || null,
        price_range: surveyData.price_range || null,
        purchase_platform: surveyData.where_to_buy || null,
        purchase_likelihood: surveyData.purchase_decision || null,
        decision_factors: surveyData.decision_reasoning || surveyData.search_improvement || null
      };
      
      console.log('Inserting to post_survey:', insertData);
      
      const { data, error } = await supabase
        .from('post_survey')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save post survey:', error);
      } else {
        console.log('Post survey saved successfully:', data);
      }
    } catch (error) {
      console.error('Failed to save post survey:', error);
    }
    
    await this.trackEvent({
      type: 'survey',
      timestamp: Date.now(),
      data: { type: 'post_task', ...surveyData }
    });
  }

  async trackBudgetRange(budgetRange: string): Promise<void> {
    if (!this.sessionData) return;

    console.log('Tracking budget range:', budgetRange);
    
    // Update session with budget range
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          budget_range: budgetRange
        })
        .eq('id', this.sessionData.sessionId);

      if (error) {
        console.error('Failed to update budget range:', error);
      } else {
        console.log('Budget range updated successfully');
      }
    } catch (error) {
      console.error('Failed to update budget range:', error);
    }
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
    // This method is kept for compatibility but doesn't update database
    // since the new schema doesn't have these fields
    console.log('Search experience 1 data:', data);
  }

  async updateSearchExperience2(data: any): Promise<void> {
    // This method is kept for compatibility but doesn't update database
    // since the new schema doesn't have these fields
    console.log('Search experience 2 data:', data);
  }

  async markCompleted(): Promise<void> {
    // This method is kept for compatibility but doesn't update database
    // since the new schema doesn't have a completed field
    console.log('Session marked as completed');
  }

  async markExitedEarly(): Promise<void> {
    // This method is kept for compatibility but doesn't update database
    // since the new schema doesn't have an exited_early field
    console.log('Session marked as exited early');
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
      const browser = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)/)?.[1] || 'Unknown';
      
      // Get budget range from sessionStorage if available
      const budgetRange = sessionStorage.getItem('selectedBudgetRange');
      
      const { data, error } = await supabase
        .from('sessions')
        .upsert({
          id: this.sessionData.sessionId, // Use the sessionId as the primary key
          user_id: this.sessionData.userId,
          platform: 'Google', // Since this is for Google search interface
          device_type: deviceType,
          browser: browser,
          location: 'Unknown', // Could be enhanced with geolocation
          budget_range: budgetRange // Add budget range to session
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save session data to Supabase:', error);
      } else {
        console.log('Session saved successfully:', data);
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