import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealTimeTrackingProps {
  sessionId: string | null;
  onInteractionUpdate?: (data: any) => void;
  onQueryTimingUpdate?: (data: any) => void;
  onSessionSummaryUpdate?: (data: any) => void;
}

export const useRealTimeTracking = ({
  sessionId,
  onInteractionUpdate,
  onQueryTimingUpdate,
  onSessionSummaryUpdate
}: UseRealTimeTrackingProps) => {
  const channelRef = useRef<any>(null);

  const trackInteractionDetail = useCallback(async (
    interactionId: string,
    interactionType: string,
    elementId: string,
    value: string
  ) => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase.functions.invoke('realtime-streams/track-interaction-detail', {
        body: {
          interaction_id: interactionId,
          interaction_type: interactionType,
          element_id: elementId,
          value: value
        }
      });

      if (error) {
        console.error('Error tracking interaction detail:', error);
      }

      return data;
    } catch (error) {
      console.error('Error in trackInteractionDetail:', error);
    }
  }, [sessionId]);

  const trackQueryTiming = useCallback(async (
    queryId: string,
    metrics: {
      searchDurationMs?: number;
      timeToFirstResult?: number;
      timeToFirstClickMs?: number;
      resultsLoadedCount?: number;
      userClicked?: boolean;
      userScrolled?: boolean;
      queryAbandoned?: boolean;
    }
  ) => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase.functions.invoke('realtime-streams/track-query-timing', {
        body: {
          query_id: queryId,
          search_duration_ms: metrics.searchDurationMs,
          time_to_first_result: metrics.timeToFirstResult,
          time_to_first_click_ms: metrics.timeToFirstClickMs,
          results_loaded_count: metrics.resultsLoadedCount,
          user_clicked: metrics.userClicked,
          user_scrolled: metrics.userScrolled,
          query_abandoned: metrics.queryAbandoned
        }
      });

      if (error) {
        console.error('Error tracking query timing:', error);
      }

      return data;
    } catch (error) {
      console.error('Error in trackQueryTiming:', error);
    }
  }, [sessionId]);

  const getSessionSummary = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const { data, error } = await supabase.functions.invoke('realtime-streams/get-session-summary', {
        body: { session_id: sessionId }
      });

      if (error) {
        console.error('Error getting session summary:', error);
        return null;
      }

      return data?.data;
    } catch (error) {
      console.error('Error in getSessionSummary:', error);
      return null;
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    // Set up real-time subscriptions
    channelRef.current = supabase
      .channel('tracking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interaction_details'
        },
        (payload) => {
          console.log('Interaction detail update:', payload);
          onInteractionUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'query_timing_metrics'
        },
        (payload) => {
          console.log('Query timing update:', payload);
          onQueryTimingUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_timing_summary'
        },
        (payload) => {
          console.log('Session summary update:', payload);
          onSessionSummaryUpdate?.(payload);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, onInteractionUpdate, onQueryTimingUpdate, onSessionSummaryUpdate]);

  return {
    trackInteractionDetail,
    trackQueryTiming,
    getSessionSummary
  };
};