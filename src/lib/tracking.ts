import { collection, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
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
    const sessionId = token || uuidv4();
    
    this.sessionData = {
      sessionId,
      userId: sessionId, // Using session ID as user ID for anonymity
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

    // Save to Firebase
    try {
      await this.saveToFirebase();
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

  async trackQuery(query: string, resultsCount: number): Promise<void> {
    if (!this.sessionData) return;

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
  }

  async trackClick(url: string, title: string, position: number): Promise<void> {
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

  private async saveToFirebase(): Promise<void> {
    if (!this.sessionData) return;

    try {
      const docRef = doc(db, 'research_sessions', this.sessionData.sessionId);
      await setDoc(docRef, this.sessionData, { merge: true });
    } catch (error) {
      console.error('Firebase save error:', error);
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