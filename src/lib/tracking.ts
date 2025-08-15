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
  private sessionStartTime: number | null = null;
  private queryStartTime: number | null = null;
  private firstClickRecorded: boolean = false;
  private firstInteractionRecorded: boolean = false;
  private isTracking: boolean = false;

  // Helper methods for calculations
  private calculateAvgTimeToClick(): number {
    if (!this.sessionData || this.sessionData.searchPhase.clicks.length === 0) return 0;
    let totalTime = 0;
    let count = 0;
    
    this.sessionData.searchPhase.clicks.forEach(click => {
      const queryTime = this.sessionData!.searchPhase.queries.find(q => 
        Math.abs(q.timestamp - click.timestamp) < 300000 // within 5 minutes
      )?.timestamp;
      if (queryTime) {
        totalTime += (click.timestamp - queryTime);
        count++;
      }
    });
    
    return count > 0 ? totalTime / count : 0;
  }

  private calculateMaxQueryTime(): number {
    if (!this.sessionData || this.sessionData.searchPhase.queries.length === 0) return 0;
    let maxTime = 0;
    for (let i = 0; i < this.sessionData.searchPhase.queries.length - 1; i++) {
      const timeDiff = this.sessionData.searchPhase.queries[i + 1].timestamp - 
                      this.sessionData.searchPhase.queries[i].timestamp;
      maxTime = Math.max(maxTime, timeDiff);
    }
    return maxTime;
  }

  private calculateMinQueryTime(): number {
    if (!this.sessionData || this.sessionData.searchPhase.queries.length === 0) return 0;
    let minTime = Infinity;
    for (let i = 0; i < this.sessionData.searchPhase.queries.length - 1; i++) {
      const timeDiff = this.sessionData.searchPhase.queries[i + 1].timestamp - 
                      this.sessionData.searchPhase.queries[i].timestamp;
      minTime = Math.min(minTime, timeDiff);
    }
    return minTime === Infinity ? 0 : minTime;
  }

  /**
   * Track a search query event and save to Supabase with enhanced metrics
   */
  async trackQuery(query: string, resultsCount: number): Promise<string | null> {
    if (!this.sessionData) return null;
    const timestamp = Date.now();
    this.queryStartTime = timestamp;
    
    // Add query to sessionData
    this.sessionData.searchPhase.queries.push({
      query,
      timestamp,
      resultsCount
    });
    
    // Save query event to Supabase
    try {
      const { data, error } = await supabase
        .from('experiment_queries')
        .insert({
          session_id: this.sessionData.sessionId,
          query_text: query,
          results_count: resultsCount,
          query_start_time: new Date(timestamp).toISOString()
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      const queryId = data.id;
      
      // Create query timing metrics record
      await supabase
        .from('query_timing_metrics')
        .insert({
          query_id: queryId,
          search_duration_ms: 0,
          time_to_first_result: null,
          time_to_first_click_ms: null,
          results_loaded_count: resultsCount,
          user_clicked: false,
          user_scrolled: false,
          query_abandoned: false
        });
      
      // Update session timing summary
      await this.updateSessionTimingSummary();
      
      return queryId;
    } catch (error) {
      console.error('Failed to track query:', error);
      return null;
    }
  }

  /**
   * Enhanced click tracking with comprehensive metrics
   */
  async trackClickWithDetails(
    url: string,
    title: string,
    position: number,
    queryId: string,
    additionalDetails?: {
      element_text?: string;
      page_coordinates?: { x: number; y: number };
      viewport_coordinates?: { x: number; y: number };
      scroll_depth?: number;
      hover_duration_ms?: number;
    }
  ): Promise<void> {
    if (!this.sessionData) return;

    const clickTimestamp = Date.now();
    const timeToClick = this.queryStartTime ? clickTimestamp - this.queryStartTime : null;
    const timeFromSessionStart = clickTimestamp - this.sessionData.startTime;

    try {
      // 1. Create main interaction record
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          query_id: queryId,
          interaction_type: 'click',
          clicked_url: url,
          clicked_rank: position,
          clicked_result_count: 1,
          element_id: `search_result_${position}`,
          element_text: title,
          session_time_ms: timeFromSessionStart,
          interaction_time: new Date(clickTimestamp).toISOString(),
          scroll_depth: additionalDetails?.scroll_depth || window.scrollY,
          page_coordinates: additionalDetails?.page_coordinates ? 
            `(${additionalDetails.page_coordinates.x},${additionalDetails.page_coordinates.y})` : null,
          viewport_coordinates: additionalDetails?.viewport_coordinates ?
            `(${additionalDetails.viewport_coordinates.x},${additionalDetails.viewport_coordinates.y})` : null,
          interaction_metadata: {
            title,
            position,
            ...additionalDetails,
            viewport_height: window.innerHeight,
            device_pixel_ratio: window.devicePixelRatio || 1
          }
        })
        .select('id')
        .single();
 
      if (interactionError) throw interactionError;
 
 
      // 2. Create interaction details record
      await supabase
        .from('interaction_details')
        .insert({
          interaction_id: interaction.id,
          interaction_type: 'click',
          action_type: 'result_click',
          element_id: `search_result_${position}`,
          value: url,
          metadata: {
            title,
            position,
            additional_data: additionalDetails || {},
            page_scroll_y: additionalDetails?.scroll_depth || window.scrollY,
            timestamp_action: clickTimestamp
          }
        });

      // 3. Update query timing metrics
      await supabase
        .from('query_timing_metrics')
        .update({
          user_clicked: true,
          time_to_first_click_ms: timeToClick
        })
        .eq('query_id', queryId);

      // 4. Update session data
      this.sessionData.searchPhase.clicks.push({
        url,
        title,
        position,
        timestamp: clickTimestamp
      });

      // 5. Update session timing summary
      await this.updateSessionTimingSummary();

    } catch (error) {
      console.error('Failed to track click with details:', error);
    }
  }

  // Compatibility wrapper for simple click tracking
  async trackClick(url: string, title: string, position: number, queryId: string): Promise<void> {
    return this.trackClickWithDetails(url, title, position, queryId);
  }

  /**
   * Enhanced scroll tracking with metrics
   */
  async trackScrollWithTiming(scrollY: number, queryId?: string): Promise<void> {
    if (!this.sessionData) return;

    const scrollTimestamp = Date.now();
    const scrollPercentage = Math.round((scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

    try {
      // 1. Create scroll interaction
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          query_id: queryId,
          interaction_type: 'scroll',
          scroll_depth: Math.min(scrollPercentage, 100),
          session_time_ms: scrollTimestamp - this.sessionData.startTime,
          interaction_time: new Date(scrollTimestamp).toISOString(),
          interaction_metadata: {
            scroll_y: scrollY,
            scroll_percentage: scrollPercentage,
            viewport_height: window.innerHeight,
            document_height: document.body.scrollHeight
          }
        })
        .select('id')
        .single();

      if (interactionError) throw interactionError;

      // 2. Create interaction details
      await supabase
        .from('interaction_details')
        .insert({
          interaction_id: interaction.id,
          interaction_type: 'scroll',
          action_type: 'page_scroll',
          element_id: 'page',
          value: scrollY.toString(),
          metadata: {
            scroll_percentage: scrollPercentage,
            page_scroll_y: scrollY,
            viewport_height: window.innerHeight
          }
        });

      // 3. Update query timing metrics if queryId provided
      if (queryId) {
        await supabase
          .from('query_timing_metrics')
          .update({ user_scrolled: true })
          .eq('query_id', queryId);
      }

      // 4. Update session data
      this.sessionData.searchPhase.scrollEvents.push({
        scrollY,
        timestamp: scrollTimestamp
      });

    } catch (error) {
      console.error('Failed to track scroll with timing:', error);
    }
  }

  /**
   * Update session timing summary with latest metrics
   */
  async updateSessionTimingSummary(): Promise<void> {
    if (!this.sessionData) return;

    const sessionDuration = Date.now() - this.sessionData.startTime;
    const totalQueries = this.sessionData.searchPhase.queries.length;
    const totalClicks = this.sessionData.searchPhase.clicks.length;
    const totalScrolls = this.sessionData.searchPhase.scrollEvents.length;

    try {
      await supabase
        .from('session_timing_summary')
        .upsert({
          session_id: this.sessionData.sessionId,
          total_session_duration_ms: sessionDuration,
          total_searches: totalQueries,
          successful_queries: totalClicks > 0 ? 1 : 0,
          avg_time_per_query: totalQueries > 0 ? sessionDuration / totalQueries : 0,
          total_clicks: totalClicks,
          avg_time_to_click: this.calculateAvgTimeToClick(),
          clicks_per_query: totalQueries > 0 ? totalClicks / totalQueries : 0,
          queries_per_minute: sessionDuration > 0 ? (totalQueries * 60000) / sessionDuration : 0
        });
    } catch (error) {
      console.error('Failed to update session timing summary:', error);
    }
  }





  /**
   * Finalize session with comprehensive metrics update
   */
  async finalizeSession(): Promise<void> {
    if (!this.sessionData) return;

    const endTime = Date.now();
    const totalDuration = endTime - this.sessionData.startTime;

    try {
      // Update sessions table with final metrics
      // Skipping sessions table update due to schema constraints

      // Update session timing summary with final metrics
      await this.updateSessionTimingSummary();

      // Reset tracking state
      this.sessionData = null;
      this.sessionStartTime = null;
      this.queryStartTime = null;
      this.firstClickRecorded = false;
      this.firstInteractionRecorded = false;
      this.isTracking = false;

    } catch (error) {
      console.error('Failed to finalize session:', error);
    }
  }
  // --- Tracking methods for Welcome page ---
  async trackConsent(consentGiven: boolean): Promise<void> {
    // Track consent event
    await this.trackEvent({
      type: 'consent',
      timestamp: Date.now(),
      data: { consentGiven }
    });
    if (this.sessionData) this.sessionData.consentGiven = consentGiven;
  }

  async trackWelcomePageAction(action: string): Promise<void> {
    // Track welcome page action (e.g., 'in_progress', 'exited')
    await this.trackEvent({
      type: 'welcome_page',
      timestamp: Date.now(),
      data: { action }
    });
  }

  async trackExitButtonClick(): Promise<void> {
    // Track exit button click event
    await this.trackEvent({
      type: 'exit_button',
      timestamp: Date.now(),
      data: { location: 'welcome_page' }
    });
  }

  async trackExitStudy(reason: string): Promise<void> {
    if (!this.sessionData) return;

    try {
      // Try to insert into survey_exits table first
      const { data, error } = await supabase
        .from('survey_exits')
        .insert({
          session_id: this.sessionData.sessionId,
          survey_type: 'general',
          exit_reason: reason,
          exit_time: new Date().toISOString(),
          page_url: window.location.href,
          user_agent: navigator.userAgent
        })
        .select('id')
        .single();

      if (error) {
        // Fallback: update sessions table - try different approach
        console.log('Survey exits table not available, using fallback tracking');
      }

      // Track as event
      await this.trackEvent({
        type: 'exit_study',
        timestamp: Date.now(),
        data: { reason }
      });

      console.log('Exit study event tracked successfully');
    } catch (error) {
      console.error('Failed to track exit study:', error);
    }
  }

  async trackConsentCheckbox(checked: boolean): Promise<void> {
    // Track consent checkbox interaction
    await this.trackEvent({
      type: 'consent_checkbox',
      timestamp: Date.now(),
      data: { checked }
    });
  }
    /**
     * Returns the current session data (for use in UI and tracking)
     */
    getSessionData(): SessionData | null {
      return this.sessionData || null;
    }
  /**
   * Track enhanced scroll events with scroll position and queryId
   */
  async trackEnhancedScroll(scrollY: number, queryId?: string): Promise<void> {
    // Example scroll tracking logic
    const scrollData = {
      scrollY,
      timestamp: Date.now(),
      scroll_percentage: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
    };
    // If we have queryId, track as interaction
    if (queryId) {
      try {
        const { data: interaction, error } = await supabase
          .from('interactions')
        .insert({
          query_id: queryId,
          interaction_type: 'scroll',
          scroll_depth: Math.min(scrollData.scroll_percentage, 100),
          session_time_ms: Date.now() - this.sessionData!.startTime
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


  setupEnhancedEventListeners(): void {
    if (!this.sessionData) return;
    let hoverStartTime: number | null = null;
    let currentHoverElement: HTMLElement | null = null;
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
        if (hoverDuration > 100 && queryId) {
          this.trackHover(currentHoverElement, hoverDuration, queryId);
          this.trackFirstInteraction(queryId, 'hover');
        }
        hoverStartTime = null;
        currentHoverElement = null;
      }
    });
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentQueryId = document.querySelector('[data-current-query-id]')?.getAttribute('data-current-query-id');
        this.trackEnhancedScroll(window.scrollY, currentQueryId || undefined);
        if (currentQueryId) {
          this.trackFirstInteraction(currentQueryId, 'scroll');
        }
      }, 150);
    });
    window.addEventListener('resize', () => {
      this.trackViewportMetrics();
    });
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      const searchInput = target.closest('input[type="search"], input[data-search-input]');
      if (searchInput) {
        const currentQueryId = document.querySelector('[data-current-query-id]')?.getAttribute('data-current-query-id');
        if (currentQueryId) {
          this.trackFirstInteraction(currentQueryId, 'focus');
        }
      }
    });
    this.trackViewportMetrics();
    console.log('✅ Enhanced event listeners initialized');
  }

  async trackBudgetRange(budgetRange: string): Promise<void> {
    if (!this.sessionData) {
      console.error('No session data available for budget range tracking');
      return;
    }
    console.log('Tracking budget range:', budgetRange, 'for session:', this.sessionData.sessionId);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ budget_range: budgetRange })
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
        .from('search_sessions')
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
        .from('search_sessions')
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

    // Update session with viewport data - skip due to schema constraints
    try {
      // Note: session_metadata field doesn't exist in current schema
      console.log('Viewport metrics tracked locally:', viewportMetrics);
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
      element_rect: {
        top: rect.top + window.scrollY,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      },
      viewport_metrics: {
        viewport_height: window.innerHeight,
        viewport_width: window.innerWidth,
        device_pixel_ratio: window.devicePixelRatio || 1
      },
      scroll_position: currentScrollY,
      timestamp: clickTimestamp
    };

    try {
      // Track the click event
      await this.trackEvent({
        type: 'click',
        timestamp: clickTimestamp,
        data: {
          url,
          title,
          position,
          queryId,
          additionalData
        }
      });
    } catch (error) {
      console.error('Failed to track enhanced click:', error);
    }
  }

  private async trackEvent(event: any): Promise<void> {
    if (!this.sessionData) return;

    // Add event to session data for local storage
    this.sessionData.events.push(event);
    
    try {
      // Save to appropriate table based on event type
      if (event.type === 'click') {
        // Save click interactions to interactions table
        const { data, error } = await supabase
          .from('interactions')
          .insert({
            session_id: this.sessionData.sessionId,
            query_id: event.data.queryId,
            interaction_type: 'click',
            target_url: event.data.url,
            target_title: event.data.title,
            result_position: event.data.position,
            timestamp: new Date(event.timestamp).toISOString(),
            interaction_metadata: event.data.additionalData
          })
          .select('id')
          .single();

        if (error) throw error;

        // Also save detailed interaction data
        if (data?.id) {
          await supabase
            .from('interaction_details')
            .insert({
              interaction_id: data.id,
              interaction_type: 'click',
              action_type: 'click',
              element_id: event.data.additionalData?.element_id || 'unknown',
              timestamp_action: new Date(event.timestamp).toISOString(),
              additional_data: event.data.additionalData
            });
        }
      } else if (event.type === 'scroll') {
        // Save scroll interactions
        const { data, error } = await supabase
          .from('interactions')
          .insert({
            session_id: this.sessionData.sessionId,
            query_id: event.data.queryId,
            interaction_type: 'scroll',
            scroll_depth: event.data.scrollPercentage,
            timestamp: new Date(event.timestamp).toISOString(),
            interaction_metadata: event.data
          })
          .select('id')
          .single();

        if (error) throw error;

        if (data?.id) {
          await supabase
            .from('interaction_details')
            .insert({
              interaction_id: data.id,
              interaction_type: 'scroll',
              action_type: 'scroll',
              element_id: 'page',
              value: event.data.scrollY?.toString(),
              timestamp_action: new Date(event.timestamp).toISOString(),
              additional_data: event.data
            });
        }
      } else {
        // For general events, we'll skip interaction_details due to schema constraints
        // Just track the event locally in session data
        console.log(`Event ${event.type} tracked locally only due to schema constraints`);
      }
      
      // Update local storage
      localStorage.setItem('research_session', JSON.stringify(this.sessionData));
    } catch (error) {
      console.error(`Failed to track ${event.type} event:`, error);
    }
  }

  async trackScroll(scrollY: number): Promise<void> {
    if (!this.sessionData) return;

    const scrollPercentage = Math.round((scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    
    await this.trackEvent({
      type: 'scroll',
      timestamp: Date.now(),
      data: {
        scrollY,
        scrollPercentage: Math.min(scrollPercentage, 100),
        documentHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight
      }
    });
  }

  async trackFirstInteraction(queryId: string, interactionType: string): Promise<void> {
    if (!this.firstInteractionRecorded && queryId) {
      this.firstInteractionRecorded = true;
      
      await this.trackEvent({
        type: 'first_interaction',
        timestamp: Date.now(),
        data: {
          queryId,
          interactionType,
          timeFromQueryStart: this.queryStartTime ? Date.now() - this.queryStartTime : null
        }
      });
    }
  }

  async trackHover(element: HTMLElement, duration: number, queryId?: string): Promise<void> {
    if (!this.sessionData) return;

    const rect = element.getBoundingClientRect();
    
    await this.trackEvent({
      type: 'hover',
      timestamp: Date.now(),
      data: {
        queryId,
        duration,
        element_tag: element.tagName.toLowerCase(),
        element_class: element.className,
        element_id: element.id,
        element_text: element.textContent?.slice(0, 100) || '',
        element_rect: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        }
      }
    });
  }

  async trackBackgroundSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    try {
      const { data, error } = await supabase
        .from('background_surveys')
        .insert({
          session_id: this.sessionData.sessionId,
          age_group: surveyData.age,
          gender: surveyData.gender,
          education: surveyData.education,
          country: surveyData.country,
          native_language: surveyData.native_language || 'English',
          shopping_experience: parseInt(surveyData.experience_scale_q7) || null,
          product_research_familiarity: parseInt(surveyData.familiarity_scale_q8) || null,
          google_search_frequency: surveyData.search_frequency,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update session data
      this.sessionData.backgroundSurvey = surveyData;
      localStorage.setItem('research_session', JSON.stringify(this.sessionData));
      
      console.log('Background survey tracked successfully:', data);
    } catch (error) {
      console.error('Failed to track background survey:', error);
      throw error;
    }
  }

  async trackPostTaskSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    try {
      const { data, error } = await supabase
        .from('post_survey')
        .insert({
          session_id: this.sessionData.sessionId,
          google_satisfaction: parseInt(surveyData.google_satisfaction) || null,
          google_ease: parseInt(surveyData.google_ease) || null,
          google_relevance: parseInt(surveyData.google_relevance) || null,
          google_trust: parseInt(surveyData.google_trust) || null,
          google_query_modifications: surveyData.google_query_modifications,
          attention_check: parseInt(surveyData.attention_check) || null,
          google_open_feedback: surveyData.google_open_feedback,
          task_duration: surveyData.task_duration,
          search_tool_type: 'Google'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update session data
      this.sessionData.postTaskSurvey = surveyData;
      localStorage.setItem('research_session', JSON.stringify(this.sessionData));
      
      console.log('Post task survey tracked successfully:', data);
    } catch (error) {
      console.error('Failed to track post task survey:', error);
      throw error;
    }
  }
}

export const trackingService = new TrackingService();
