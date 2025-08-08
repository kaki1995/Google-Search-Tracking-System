import React, { useState, useEffect } from 'react';
import { useRealTimeTracking } from '@/hooks/useRealTimeTracking';
import { trackingService } from '@/lib/tracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const RealTimeDebugPanel: React.FC = () => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);

  const session = trackingService.getSessionData();
  const sessionId = session?.sessionId || null;

  const {
    trackInteractionDetail,
    trackQueryTiming,
    getSessionSummary
  } = useRealTimeTracking({
    sessionId,
    onInteractionUpdate: (payload) => {
      setRealtimeUpdates(prev => [...prev.slice(-9), {
        type: 'interaction',
        timestamp: Date.now(),
        data: payload
      }]);
    },
    onQueryTimingUpdate: (payload) => {
      setRealtimeUpdates(prev => [...prev.slice(-9), {
        type: 'query_timing',
        timestamp: Date.now(),
        data: payload
      }]);
    },
    onSessionSummaryUpdate: (payload) => {
      setRealtimeUpdates(prev => [...prev.slice(-9), {
        type: 'session_summary',
        timestamp: Date.now(),
        data: payload
      }]);
      setSessionSummary(payload.new || payload);
    }
  });

  useEffect(() => {
    const updateSessionData = () => {
      setSessionData(trackingService.getSessionData());
    };

    updateSessionData();
    const interval = setInterval(updateSessionData, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sessionId) {
      getSessionSummary().then(setSessionSummary);
    }
  }, [sessionId, getSessionSummary]);

  if (!sessionData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Real-Time Tracking Debug Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No session data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Session Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Badge variant="outline">Session ID</Badge>
            <p className="text-sm font-mono mt-1">{sessionData.sessionId}</p>
          </div>
          <div>
            <Badge variant="outline">Queries</Badge>
            <p className="text-sm mt-1">{sessionData.searchPhase.queries.length}</p>
          </div>
          <div>
            <Badge variant="outline">Clicks</Badge>
            <p className="text-sm mt-1">{sessionData.searchPhase.clicks.length}</p>
          </div>
          <div>
            <Badge variant="outline">Events</Badge>
            <p className="text-sm mt-1">{sessionData.events.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessionSummary ? (
            <>
              <div>
                <Badge variant="outline">Total Searches</Badge>
                <p className="text-sm mt-1">{sessionSummary.total_searches || 0}</p>
              </div>
              <div>
                <Badge variant="outline">Total Clicks</Badge>
                <p className="text-sm mt-1">{sessionSummary.total_clicks || 0}</p>
              </div>
              <div>
                <Badge variant="outline">Avg Time per Query</Badge>
                <p className="text-sm mt-1">{sessionSummary.avg_time_per_query || 0}ms</p>
              </div>
              <div>
                <Badge variant="outline">Session Duration</Badge>
                <p className="text-sm mt-1">{sessionSummary.total_session_duration_ms || 0}ms</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No summary data available</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Real-Time Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {realtimeUpdates.length === 0 ? (
              <p className="text-muted-foreground">No real-time updates yet</p>
            ) : (
              realtimeUpdates.map((update, index) => (
                <div key={index} className="p-2 border rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={
                      update.type === 'interaction' ? 'default' :
                      update.type === 'query_timing' ? 'secondary' : 'destructive'
                    }>
                      {update.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(update.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};