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

  async trackWelcomePageAction(action: 'consented' | 'exited' | 'in_progress' | 'consent_clicked' | 'consent_unchecked' | 'exit_button_clicked'): Promise<void> {
    if (!this.sessionData) {
      console.warn('No session data available for welcome page tracking');
      return;
    }

    console.log('Tracking welcome page action:', action, 'for session:', this.sessionData.sessionId);
    
    try {
      // Only update the main welcome_page_action for final states
      const finalStates = ['consented', 'exited'];
      const updateData: any = {};
      
      if (finalStates.includes(action)) {
        updateData.welcome_page_action = action;
      }

      if (Object.keys(updateData).length > 0) {
        const { data, error } = await supabase
          .from('sessions')
          .update(updateData)
          .eq('id', this.sessionData.sessionId)
          .select('welcome_page_action');

        if (error) {
          console.error('Failed to update welcome page action:', error);
        } else {
          console.log('Welcome page action updated successfully:', data);
        }
      }
    } catch (error) {
      console.error('Failed to update welcome page action:', error);
    }

    // Always track as an event for detailed analytics
    await this.trackEvent({
      type: 'consent',
      timestamp: Date.now(),
      data: { welcome_page_action: action, page: 'welcome' }
    });
  }

  async trackConsentCheckbox(isChecked: boolean): Promise<void> {
    // Track when user clicks the consent checkbox
    if (isChecked) {
      await this.trackWelcomePageAction('consent_clicked');
    } else {
      await this.trackWelcomePageAction('consent_unchecked');
    }
    
    await this.trackEvent({
      type: 'consent',
      timestamp: Date.now(),
      data: { consent_checkbox_checked: isChecked, action: 'checkbox_interaction' }
    });
  }

  async trackExitButtonClick(): Promise<void> {
    // Track when user clicks the exit button specifically
    await this.trackWelcomePageAction('exit_button_clicked');
    
    await this.trackEvent({
      type: 'consent',
      timestamp: Date.now(),
      data: { action: 'exit_button_clicked', page: 'welcome' }
    });
  }

  async trackConsent(given: boolean, details?: any): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.consentGiven = given;
    
    // Update welcome page action based on consent
    if (given) {
      await this.trackWelcomePageAction('consented');
    }
    
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
          results_count: Math.min(resultsCount, 2147483647), // Cap to max int value
          results_loaded_count: Math.min(resultsCount, 2147483647), // Cap to max int value
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
      console.warn('⚠️ trackClick called without queryId - interaction will NOT be saved to database');
      console.warn('📊 Click details:', { url, title, position });
      console.warn('💡 This usually means:');
      console.warn('   1. User clicked before performing a search');
      console.warn('   2. currentQueryId is null/undefined in SearchResults component');
      console.warn('   3. Search query tracking failed');
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

<<<<<<< HEAD
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
=======
  // Enhanced Interaction Metrics - Missing implementations

  /**
   * Track time to first result when search results are loaded
   */
  async trackTimeToFirstResult(queryId: string): Promise<void> {
    if (!this.sessionData) return;

    const queryStartTime = this.sessionData.events.find(e => 
      e.type === 'query' && e.data.queryId === queryId
    )?.timestamp;

    if (queryStartTime) {
      const timeToFirstResult = Date.now() - queryStartTime;
      
      try {
        await supabase
          .from('query_timing_metrics')
          .update({
            time_to_first_result: timeToFirstResult
          })
          .eq('query_id', queryId);

        console.log(`Time to first result: ${timeToFirstResult}ms for query ${queryId}`);
      } catch (error) {
        console.error('Failed to update time to first result:', error);
      }
    }
  }

  /**
   * Track viewport dimensions and window metrics
   */
  async trackViewportMetrics(): Promise<void> {
    if (!this.sessionData) return;

    const viewportMetrics = {
      viewport_height: window.innerHeight,
      viewport_width: window.innerWidth,
      screen_height: window.screen.height,
      screen_width: window.screen.width,
      device_pixel_ratio: window.devicePixelRatio || 1,
      timestamp: Date.now()
    };

    // Update session with viewport data
    try {
      await supabase
        .from('sessions')
        .update({
          session_metadata: {
            ...this.sessionData.deviceInfo,
            viewport_metrics: viewportMetrics
          }
        })
        .eq('id', this.sessionData.sessionId);

      console.log('Viewport metrics tracked:', viewportMetrics);
    } catch (error) {
      console.error('Failed to track viewport metrics:', error);
    }
  }

  /**
   * Enhanced click tracking with DOM element details and viewport info
   */
  async trackEnhancedClick(
    element: HTMLElement, 
    url: string, 
    title: string, 
    position: number, 
    queryId?: string
  ): Promise<void> {
    if (!this.sessionData) return;

    const rect = element.getBoundingClientRect();
    const clickTimestamp = Date.now();
    const currentScrollY = window.scrollY;

    // Extract additional data from element
    const additionalData = {
      element_tag: element.tagName.toLowerCase(),
      element_class: element.className,
      element_id: element.id,
      element_text: element.textContent?.slice(0, 100) || '',
      element_href: element.getAttribute('href'),
      data_attributes: Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {})
    };

    const enhancedClickData = {
      url,
      title,
      position,
      result_rank: position,
      page_scroll_y: currentScrollY,
      viewport_height: window.innerHeight,
      viewport_coordinates: {
        x: rect.left,
        y: rect.top
      },
      page_coordinates: {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
      },
      additional_data: additionalData,
      timestamp_action: clickTimestamp
    };

    // Call original trackClick first
    await this.trackClick(url, title, position, queryId);

    // If we have queryId, enhance the interaction record
    if (queryId) {
      try {
        // Update the interaction with enhanced data
        const { data: interactions } = await supabase
          .from('interactions')
          .select('id')
          .eq('query_id', queryId)
          .eq('clicked_url', url)
          .order('created_at', { ascending: false })
          .limit(1);

        if (interactions && interactions.length > 0) {
          const interactionId = interactions[0].id;

          // Update interaction with enhanced fields
          await supabase
            .from('interactions')
            .update({
              interaction_type: 'click',
              element_id: element.id || `result_${position}`,
              element_text: element.textContent?.slice(0, 100) || title,
              page_coordinates: `(${enhancedClickData.page_coordinates.x},${enhancedClickData.page_coordinates.y})`,
              viewport_coordinates: `(${enhancedClickData.viewport_coordinates.x},${enhancedClickData.viewport_coordinates.y})`,
              interaction_metadata: enhancedClickData.additional_data,
              session_time_ms: clickTimestamp - this.sessionData.startTime
            })
            .eq('id', interactionId);

          // Add detailed interaction record
          await supabase
            .from('interaction_details')
            .insert({
              interaction_id: interactionId,
              interaction_type: 'click',
              element_id: element.id || `result_${position}`,
              value: url,
              metadata: {
                ...enhancedClickData,
                action_type: 'result_click'
              }
            });

          console.log('Enhanced click data tracked for interaction:', interactionId);
        }
      } catch (error) {
        console.error('Failed to track enhanced click data:', error);
      }
    }
  }

  /**
   * Track hover interactions
   */
  async trackHover(element: HTMLElement, duration: number, queryId?: string): Promise<void> {
    if (!this.sessionData || !queryId) return;

    const hoverData = {
      element_id: element.id || element.className || 'unknown',
      element_text: element.textContent?.slice(0, 50) || '',
      hover_duration_ms: duration,
      page_scroll_y: window.scrollY,
      viewport_height: window.innerHeight,
      timestamp: Date.now()
    };

    try {
      // Insert hover interaction
      const { data: interaction, error } = await supabase
>>>>>>> f9f040b (Commit all unstaged changes before rebase and push)
        .from('interactions')
        .insert({
          query_id: queryId,
          interaction_type: 'hover',
<<<<<<< HEAD
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

=======
          element_id: hoverData.element_id,
          element_text: hoverData.element_text,
          interaction_metadata: hoverData,
          session_time_ms: Date.now() - this.sessionData.startTime
        })
        .select('id')
        .single();

      if (!error && interaction) {
        // Add detailed hover record
        await supabase
          .from('interaction_details')
          .insert({
            interaction_id: interaction.id,
            interaction_type: 'hover',
            element_id: hoverData.element_id,
            value: hoverData.element_text,
            metadata: {
              ...hoverData,
              action_type: 'element_hover'
            }
          });

        console.log('Hover interaction tracked:', hoverData);
      }
    } catch (error) {
      console.error('Failed to track hover interaction:', error);
    }
  }

  /**
   * Enhanced scroll tracking with timing and interaction context
   */
  async trackEnhancedScroll(scrollY: number, queryId?: string): Promise<void> {
    if (!this.sessionData) return;

    const scrollData = {
      scroll_position: scrollY,
      viewport_height: window.innerHeight,
      page_height: document.documentElement.scrollHeight,
      scroll_percentage: Math.round((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
      timestamp_action: Date.now()
    };

    // Call original trackScroll
    await this.trackScroll(scrollY);

    // If we have queryId, track as interaction
    if (queryId) {
      try {
        const { data: interaction, error } = await supabase
          .from('interactions')
          .insert({
            query_id: queryId,
            interaction_type: 'scroll',
            scroll_depth: Math.min(scrollData.scroll_percentage, 100),
            interaction_metadata: scrollData,
            session_time_ms: Date.now() - this.sessionData.startTime
          })
          .select('id')
          .single();

        if (!error && interaction) {
          // Add detailed scroll record
          await supabase
            .from('interaction_details')
            .insert({
              interaction_id: interaction.id,
              interaction_type: 'scroll',
              element_id: 'page',
              value: scrollY.toString(),
              metadata: {
                ...scrollData,
                action_type: 'page_scroll'
              }
            });

          // Update query timing metrics to mark user scrolled
          await supabase
            .from('query_timing_metrics')
            .update({ user_scrolled: true })
            .eq('query_id', queryId);
        }
      } catch (error) {
        console.error('Failed to track enhanced scroll:', error);
      }
    }
  }

  /**
   * Track time to first interaction (any type)
   */
  async trackFirstInteraction(queryId: string, interactionType: string): Promise<void> {
    if (!this.sessionData) return;

    // Check if this is the first interaction for this query
    try {
      const { data: existingInteractions } = await supabase
        .from('interactions')
        .select('id')
        .eq('query_id', queryId)
        .limit(1);

      // If this is the first interaction, we just track it
      // The time_to_first_interaction_ms will be calculated in database views
      if (!existingInteractions || existingInteractions.length === 0) {
        console.log(`First interaction type for query ${queryId}: ${interactionType}`);
        
        // We can add a metadata entry to track this was the first interaction
        const { data: latestInteraction } = await supabase
          .from('interactions')
          .select('id')
          .eq('query_id', queryId)
          .order('interaction_time', { ascending: false })
          .limit(1);

        if (latestInteraction && latestInteraction.length > 0) {
          // Mark this interaction as the first one
          await supabase
            .from('interactions')
            .update({
              interaction_metadata: {
                is_first_interaction: true,
                first_interaction_type: interactionType
              }
            })
            .eq('id', latestInteraction[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to track first interaction timing:', error);
    }
  }

  /**
   * Initialize enhanced event listeners for comprehensive tracking
   */
  setupEnhancedEventListeners(): void {
    if (!this.sessionData) return;

    let hoverStartTime: number | null = null;
    let currentHoverElement: HTMLElement | null = null;

    // Enhanced click listener
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const searchResult = target.closest('[data-result-rank]');
      
      if (searchResult) {
        const rank = parseInt(searchResult.getAttribute('data-result-rank') || '0');
        const url = searchResult.getAttribute('data-result-url') || '';
        const title = searchResult.getAttribute('data-result-title') || '';
        const queryId = searchResult.getAttribute('data-query-id') || undefined;

        this.trackEnhancedClick(target, url, title, rank, queryId);
        if (queryId) {
          this.trackFirstInteraction(queryId, 'click');
        }
      }
    });

    // Hover tracking
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const searchResult = target.closest('[data-result-rank]');
      
      if (searchResult) {
        hoverStartTime = Date.now();
        currentHoverElement = searchResult as HTMLElement;
      }
    });

    document.addEventListener('mouseout', (event) => {
      if (hoverStartTime && currentHoverElement) {
        const hoverDuration = Date.now() - hoverStartTime;
        const queryId = currentHoverElement.getAttribute('data-query-id') || undefined;
        
        if (hoverDuration > 100 && queryId) { // Only track hovers longer than 100ms
          this.trackHover(currentHoverElement, hoverDuration, queryId);
          this.trackFirstInteraction(queryId, 'hover');
        }
        
        hoverStartTime = null;
        currentHoverElement = null;
      }
    });

    // Enhanced scroll listener
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentQueryId = document.querySelector('[data-current-query-id]')?.getAttribute('data-current-query-id');
        this.trackEnhancedScroll(window.scrollY, currentQueryId || undefined);
        
        if (currentQueryId) {
          this.trackFirstInteraction(currentQueryId, 'scroll');
        }
      }, 150); // Debounce scroll events
    });

    // Viewport resize tracking
    window.addEventListener('resize', () => {
      this.trackViewportMetrics();
    });

    // Focus tracking
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      const searchInput = target.closest('input[type="search"], input[data-search-input]');
      
      if (searchInput) {
        // Track search input focus as interaction
        const currentQueryId = document.querySelector('[data-current-query-id]')?.getAttribute('data-current-query-id');
        if (currentQueryId) {
          this.trackFirstInteraction(currentQueryId, 'focus');
        }
      }
    });

    // Track initial viewport metrics
    this.trackViewportMetrics();

    console.log('✅ Enhanced event listeners initialized');
  }

>>>>>>> f9f040b (Commit all unstaged changes before rebase and push)
  getSessionData(): SessionData | null {
    return this.sessionData;
  }

  clearSession(): void {
    this.sessionData = null;
    localStorage.removeItem('research_session');
  }
}

export const trackingService = new TrackingService();