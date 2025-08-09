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
  private queryStartTime: number | null = null;
  private sessionStartTime: number | null = null;
  private firstClickRecorded = false;
  private firstInteractionRecorded = false;

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

    // Initialize timing trackers
    this.sessionStartTime = Date.now();
    this.queryStartTime = null;
    this.firstClickRecorded = false;
    this.firstInteractionRecorded = false;

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

    const searchStartTime = Date.now();
    this.queryStartTime = searchStartTime; // Track when this query started
    
    const queryData = {
      query,
      timestamp: searchStartTime,
      resultsCount
    };

    this.sessionData.searchPhase.queries.push(queryData);
    
    await this.trackEvent({
      type: 'query',
      timestamp: searchStartTime,
      data: queryData
    });

    // Log to experiment_queries table
    try {
      console.log('Inserting query to experiment_queries:', {
        session_id: this.sessionData.sessionId,
        query_text: query,
        reformulation_count: this.isQueryReformulation(query) ? 1 : 0,
        query_start_time: new Date(searchStartTime).toISOString(),
        results_count: resultsCount,
        results_loaded_count: resultsCount,
        complexity: this.calculateQueryComplexity(query),
        structure_type: this.determineQueryStructureType(query)
      });

      const { data, error } = await supabase
        .from('experiment_queries')
        .insert({
          session_id: this.sessionData.sessionId,
          query_text: query,
          reformulation_count: this.isQueryReformulation(query) ? 1 : 0,
          query_start_time: new Date(searchStartTime).toISOString(),
          results_count: resultsCount,
          results_loaded_count: resultsCount,
          complexity: this.calculateQueryComplexity(query),
          structure_type: this.determineQueryStructureType(query)
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log query to Supabase:', error);
        return null;
      }

      console.log('Query logged successfully with ID:', data.id);

      // Track initial query timing metrics through real-time edge function
      try {
        await supabase.functions.invoke('realtime-streams/track-query-timing', {
          body: {
            query_id: data.id,
            search_duration_ms: Date.now() - searchStartTime,
            results_loaded_count: resultsCount,
            user_clicked: false,
            user_scrolled: false,
            query_abandoned: false
          }
        });
      } catch (edgeError) {
        console.error('Failed to track initial query timing:', edgeError);
      }

      return data.id;
    } catch (error) {
      console.error('Failed to log query to Supabase:', error);
      return null;
    }
  }

  async trackClick(url: string, title: string, position: number, queryId?: string): Promise<void> {
    if (!this.sessionData) return;

    const clickTimestamp = Date.now();
    const clickData = {
      url,
      title,
      position,
      timestamp: clickTimestamp
    };

    this.sessionData.searchPhase.clicks.push(clickData);
    
    await this.trackEvent({
      type: 'click',
      timestamp: clickTimestamp,
      data: clickData
    });

    // Calculate timing metrics
    const timeToClick = this.sessionStartTime ? clickTimestamp - this.sessionStartTime : null;
    const timeToClickFromQuery = this.queryStartTime ? clickTimestamp - this.queryStartTime : null;
    
    // Track if this is the first click
    const isFirstClick = !this.firstClickRecorded;
    if (isFirstClick) {
      this.firstClickRecorded = true;
    }

    // Log to interactions table if queryId provided
    if (queryId) {
      try {
        console.log('Inserting click to interactions:', {
          query_id: queryId,
          clicked_url: url,
          clicked_rank: position,
          clicked_result_count: 1
        });

        const { data: interaction, error } = await supabase
          .from('interactions')
          .insert({
            query_id: queryId,
            clicked_url: url,
            clicked_rank: position,
            clicked_result_count: 1,
            interaction_type: 'click',
            interaction_time: new Date(clickTimestamp).toISOString(),
            element_id: `search_result_${position}`,
            element_text: title,
            session_time_ms: timeToClick,
            query_time_ms: timeToClickFromQuery,
            interaction_metadata: {
              is_first_click: isFirstClick,
              viewport_height: window.innerHeight,
              scroll_position: window.scrollY
            }
          })
          .select('id')
          .single();

        if (error) {
          console.error('Failed to log click to Supabase:', error);
          return;
        }

        console.log('Click logged successfully with ID:', interaction.id);

        // Track detailed interaction through real-time edge function
        try {
          await supabase.functions.invoke('realtime-streams/track-interaction-detail', {
            body: {
              interaction_id: interaction.id,
              interaction_type: 'search_result_click',
              element_id: `search_result_${position}`,
              value: url
            }
          });

          // Track query timing metrics for this click
          await supabase.functions.invoke('realtime-streams/track-query-timing', {
            body: {
              query_id: queryId,
              user_clicked: true,
              time_to_first_click_ms: isFirstClick ? timeToClickFromQuery : null,
              search_duration_ms: timeToClickFromQuery,
              results_loaded_count: this.sessionData?.searchPhase.queries.find(q => q.timestamp === this.queryStartTime)?.resultsCount || 0,
              user_scrolled: this.sessionData?.searchPhase.scrollEvents.length > 0,
              query_abandoned: false
            }
          });
        } catch (edgeError) {
          console.error('Failed to track real-time data:', edgeError);
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

    const scrollTimestamp = Date.now();
    const scrollData = {
      scrollY,
      timestamp: scrollTimestamp
    };

    this.sessionData.searchPhase.scrollEvents.push(scrollData);
    
    await this.trackEvent({
      type: 'scroll',
      timestamp: scrollTimestamp,
      data: scrollData
    });

    // Track first interaction if this is the first scroll
    if (!this.firstInteractionRecorded) {
      this.firstInteractionRecorded = true;
      const timeToFirstInteraction = this.queryStartTime ? scrollTimestamp - this.queryStartTime : null;
      
      // Log this as an interaction if we have a current query
      const currentQueryId = sessionStorage.getItem("current_query_id");
      if (currentQueryId && timeToFirstInteraction) {
        try {
          await supabase
            .from('interactions')
            .insert({
              query_id: currentQueryId,
              interaction_type: 'scroll',
              interaction_time: new Date(scrollTimestamp).toISOString(),
              query_time_ms: timeToFirstInteraction,
              session_time_ms: this.sessionStartTime ? scrollTimestamp - this.sessionStartTime : null,
              scroll_depth: Math.round((scrollY / document.documentElement.scrollHeight) * 100),
              interaction_metadata: {
                is_first_interaction: true,
                scroll_position: scrollY,
                viewport_height: window.innerHeight
              }
            });
        } catch (error) {
          console.error('Failed to log first scroll interaction:', error);
        }
      }
    }
  }

  async trackBackgroundSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.backgroundSurvey = surveyData;
    
    console.log('Tracking background survey for session:', this.sessionData.sessionId);
    console.log('Survey data:', surveyData);
    
    // Save directly to background_surveys table with all fields
    try {
      const insertData = {
        session_id: this.sessionData.sessionId,
        age_group: surveyData.age,
        gender: surveyData.gender,
        education: surveyData.education,
        country: surveyData.country,
        native_language: surveyData.nationality || surveyData.native_language || null,
        google_search_frequency: surveyData.search_frequency || null,
        product_research_familiarity: parseInt(surveyData.experience_scale_q7) || null,
        shopping_experience: parseInt(surveyData.familiarity_scale_q8) || null
      };
      
      console.log('Inserting to background_surveys:', insertData);
      
      const { data, error } = await supabase
        .from('background_surveys')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save background survey:', error);
        console.error('Error details:', error);
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
    
    // Save directly to post_survey table with new Google-focused fields
    try {
      const insertData = {
        session_id: this.sessionData.sessionId,
        google_satisfaction: parseInt(surveyData.google_satisfaction) || null,
        google_ease: parseInt(surveyData.google_ease) || null,
        google_relevance: parseInt(surveyData.google_relevance) || null,
        google_trust: parseInt(surveyData.google_trust) || null,
        google_query_modifications: surveyData.google_query_modifications || null,
        attention_check: parseInt(surveyData.attention_check) || null,
        google_open_feedback: surveyData.google_open_feedback || null,
        task_duration: surveyData.task_duration || null,
        search_tool_type: surveyData.search_tool_type || null
      };
      
      console.log('Inserting to post_survey:', insertData);
      
      const { data, error } = await supabase
        .from('post_survey')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save post survey:', error);
        console.error('Error details:', error);
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
    if (!this.sessionData) {
      console.error('No session data available for budget range tracking');
      return;
    }

    console.log('Tracking budget range:', budgetRange, 'for session:', this.sessionData.sessionId);
    
    // Update session with budget range
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          budget_range: budgetRange
        })
        .eq('id', this.sessionData.sessionId)
        .select('budget_range');

      if (error) {
        console.error('Failed to update budget range:', error);
      } else {
        console.log('Budget range updated successfully:', data);
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
      
      // First check if session already exists
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('budget_range')
        .eq('id', this.sessionData.sessionId)
        .single();

      // Prepare session data
      const sessionData: any = {
        id: this.sessionData.sessionId,
        user_id: this.sessionData.userId,
        platform: 'Google',
        device_type: deviceType,
        browser: browser,
        location: 'Unknown'
      };

      // Only set budget_range if we have a value OR if there's no existing session
      // This prevents overwriting an existing budget_range with null
      if (budgetRange || !existingSession) {
        sessionData.budget_range = budgetRange;
      }

      const { data, error } = await supabase
        .from('sessions')
        .upsert(sessionData)
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

  private calculateQueryComplexity(query: string): number {
    // Calculate complexity score (1-10) based on various factors
    let score = 1;
    
    // Length factor
    if (query.length > 50) score += 2;
    else if (query.length > 20) score += 1;
    
    // Word count factor
    const wordCount = query.split(' ').length;
    if (wordCount > 6) score += 2;
    else if (wordCount > 3) score += 1;
    
    // Special characters/operators
    if (/[\"']/.test(query)) score += 1; // Quotes
    if (/[+\-]/.test(query)) score += 1; // Boolean operators
    if (/site:|filetype:|intitle:/.test(query)) score += 2; // Search operators
    
    // Question words
    if (/^(how|what|where|when|why|who)/i.test(query)) score += 1;
    
    return Math.min(score, 10);
  }

  private determineQueryStructureType(query: string): string {
    // Determine query structure type
    if (/^(how|what|where|when|why|who)/i.test(query)) {
      return 'question';
    } else if (/site:|filetype:|intitle:/.test(query)) {
      return 'advanced_search';
    } else if (/[\"']/.test(query)) {
      return 'phrase_search';
    } else if (query.split(' ').length === 1) {
      return 'single_term';
    } else if (query.split(' ').length <= 3) {
      return 'short_phrase';
    } else {
      return 'long_phrase';
    }
  }

  async trackQueryAbandonment(queryId: string): Promise<void> {
    // Track when a query is abandoned (no clicks after a certain time)
    try {
      await supabase.functions.invoke('realtime-streams/track-query-timing', {
        body: {
          query_id: queryId,
          query_abandoned: true,
          query_end_time: new Date().toISOString(),
          search_duration_ms: this.queryStartTime ? Date.now() - this.queryStartTime : null
        }
      });
    } catch (error) {
      console.error('Failed to track query abandonment:', error);
    }
  }

  async trackResultLoad(queryId: string, resultsCount: number, loadTime: number): Promise<void> {
    // Track when search results are loaded
    try {
      await supabase.functions.invoke('realtime-streams/track-query-timing', {
        body: {
          query_id: queryId,
          time_to_first_result: loadTime,
          results_loaded_count: resultsCount
        }
      });
    } catch (error) {
      console.error('Failed to track result load:', error);
    }
  }

  async trackHover(elementId: string, hoverDuration: number, queryId?: string): Promise<void> {
    // Track hover interactions
    if (!this.sessionData || !queryId) return;

    try {
      await supabase
        .from('interactions')
        .insert({
          query_id: queryId,
          interaction_type: 'hover',
          element_id: elementId,
          hover_duration_ms: hoverDuration,
          interaction_time: new Date().toISOString(),
          session_time_ms: this.sessionStartTime ? Date.now() - this.sessionStartTime : null,
          query_time_ms: this.queryStartTime ? Date.now() - this.queryStartTime : null
        });
    } catch (error) {
      console.error('Failed to track hover:', error);
    }
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