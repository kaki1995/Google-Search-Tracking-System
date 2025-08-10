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

class EnhancedTrackingService {
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
   * Initialize a new session with enhanced tracking
   */
  async initializeSession(
    userId: string, 
    budgetRange?: string, 
    location?: string,
    deviceType?: string
  ): Promise<string> {
    const sessionId = uuidv4();
    const startTime = Date.now();
    this.sessionStartTime = startTime;

    // Create session data object
    this.sessionData = {
      sessionId,
      userId,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      },
      consentGiven: false,
      searchPhase: {
        queries: [],
        clicks: [],
        scrollEvents: []
      },
      events: [],
      startTime,
    };

    try {
      // Create session in Supabase
      const { error } = await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          start_time: new Date(startTime).toISOString(),
          status: 'active',
          budget_range: budgetRange,
          location: location,
          device_type: deviceType || this.sessionData.deviceInfo.isMobile ? 'mobile' : 'desktop',
          platform: navigator.platform,
          browser: this.getBrowserName(),
          session_duration: 0,
          total_queries: 0
        });

      if (error) throw error;

      this.isTracking = true;
      return sessionId;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    }
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Track a search query event with enhanced metrics
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
          viewport_height: window.innerHeight
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
          viewport_height: window.innerHeight
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
   * Track hover events with timing
   */
  async trackHover(
    element: string,
    duration: number,
    queryId?: string,
    coordinates?: { x: number; y: number }
  ): Promise<void> {
    if (!this.sessionData) return;

    const hoverTimestamp = Date.now();

    try {
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          query_id: queryId || null,
          interaction_type: 'hover',
          element_id: element,
          session_time_ms: hoverTimestamp - this.sessionData.startTime,
          interaction_time: new Date(hoverTimestamp).toISOString(),
          viewport_height: window.innerHeight
        })
        .select('id')
        .single();

      if (interactionError) throw interactionError;

      await supabase
        .from('interaction_details')
        .insert({
          interaction_id: interaction.id,
          interaction_type: 'hover',
          action_type: 'element_hover',
          element_id: element,
          value: duration.toString(),
          metadata: {
            hover_duration_ms: duration,
            coordinates: coordinates || {},
            timestamp_action: hoverTimestamp
          }
        });

    } catch (error) {
      console.error('Failed to track hover:', error);
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
   * Track query abandonment with timing
   */
  async trackQueryAbandonment(queryId: string, reason?: string): Promise<void> {
    try {
      await supabase
        .from('query_timing_metrics')
        .update({
          query_abandoned: true,
          query_end_time: new Date().toISOString()
        })
        .eq('query_id', queryId);
    } catch (error) {
      console.error('Failed to track query abandonment:', error);
    }
  }

  /**
   * Track time to first result when search results load
   */
  async trackTimeToFirstResult(queryId: string): Promise<void> {
    if (!this.queryStartTime) return;

    const timeToFirstResult = Date.now() - this.queryStartTime;
    
    try {
      await supabase
        .from('query_timing_metrics')
        .update({ time_to_first_result: timeToFirstResult })
        .eq('query_id', queryId);
    } catch (error) {
      console.error('Failed to track time to first result:', error);
    }
  }

  /**
   * Track background survey completion
   */
  async trackBackgroundSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    try {
      const { error } = await supabase
        .from('background_surveys')
        .insert({
          session_id: this.sessionData.sessionId,
          survey_data: surveyData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      this.sessionData.backgroundSurvey = surveyData;
    } catch (error) {
      console.error('Failed to track background survey:', error);
    }
  }

  /**
   * Track post-task survey completion
   */
  async trackPostTaskSurvey(surveyData: any): Promise<void> {
    if (!this.sessionData) return;

    try {
      const { error } = await supabase
        .from('post_survey')
        .insert({
          session_id: this.sessionData.sessionId,
          survey_data: surveyData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      this.sessionData.postTaskSurvey = surveyData;
    } catch (error) {
      console.error('Failed to track post-task survey:', error);
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
      await supabase
        .from('sessions')
        .update({
          session_duration: totalDuration,
          total_queries: this.sessionData.searchPhase.queries.length,
          status: 'completed'
        })
        .eq('id', this.sessionData.sessionId);

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

  /**
   * Get current session data
   */
  getSessionData(): SessionData | null {
    return this.sessionData;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionData?.sessionId || null;
  }

  /**
   * Check if tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking && this.sessionData !== null;
  }
}

// Create singleton instance
export const enhancedTrackingService = new EnhancedTrackingService();
export default enhancedTrackingService;
