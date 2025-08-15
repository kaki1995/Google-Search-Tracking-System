import { supabase } from "@/integrations/supabase/client";
import { getOrCreateParticipantId } from "@/lib/utils/uuid";

class SessionManager {
  private participantId: string | null = null;
  private sessionId: string | null = null;
  private sessionTimingId: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Generate session-based participant ID to handle multiple users on same device
  generateSessionBasedParticipantId(): string {
    // Create a unique session-based participant ID that handles multiple users
    // on the same browser/device by combining timestamp and random components
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const browserFingerprint = this.getBrowserFingerprint();
    const sessionId = `session_${timestamp}_${random}_${browserFingerprint}`;
    return sessionId;
  }

  // Create a simple browser fingerprint for session isolation
  private getBrowserFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }
    const canvasFingerprint = canvas.toDataURL().slice(-8);
    
    const screenFingerprint = `${screen.width}x${screen.height}`;
    const timezoneFingerprint = Intl.DateTimeFormat().resolvedOptions().timeZone.slice(-3);
    
    return `${canvasFingerprint}_${screenFingerprint}_${timezoneFingerprint}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  }

  private loadFromStorage() {
    this.participantId = localStorage.getItem('participant_id');
    this.sessionId = localStorage.getItem('session_id');
    this.sessionTimingId = localStorage.getItem('session_timing_id');
  }

  private saveToStorage() {
    if (this.participantId) localStorage.setItem('participant_id', this.participantId);
    if (this.sessionId) localStorage.setItem('session_id', this.sessionId);
    if (this.sessionTimingId) localStorage.setItem('session_timing_id', this.sessionTimingId);
  }

  private clearStorage() {
    localStorage.removeItem('session_id');
    localStorage.removeItem('session_timing_id');
    // Keep participant_id
  }

  getParticipantId(): string | null {
    return this.participantId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  setParticipantId(id: string) {
    this.participantId = id;
    localStorage.setItem('participant_id', id);
  }

  ensureParticipantId(): string {
    // Use session-based participant ID for better multi-user support on same device
    if (!this.participantId) {
      this.participantId = this.generateSessionBasedParticipantId();
      localStorage.setItem('participant_id', this.participantId);
    }
    return this.participantId;
  }

  async ensureSession(): Promise<string | null> {
    if (!this.participantId) {
      console.error('No participant ID set');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('session-ensure', {
        body: { participant_id: this.participantId }
      });

      if (error || !data?.ok) {
        console.error('Failed to ensure session:', error || data?.error);
        return null;
      }

      this.sessionId = data.session_id;
      this.saveToStorage();
      return this.sessionId;
    } catch (error) {
      console.error('Session ensure error:', error);
      return null;
    }
  }

  async savePage(pageId: string, answers: Record<string, any>): Promise<boolean> {
    if (!this.participantId) {
      console.error('No participant ID for saving page');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('survey-save', {
        body: { 
          participant_id: this.participantId, 
          page_id: pageId, 
          answers 
        }
      });

      if (error || !data?.ok) {
        console.error('Failed to save page:', error || data?.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Save page error:', error);
      return false;
    }
  }

  async loadPage(pageId: string): Promise<Record<string, any> | null> {
    if (!this.participantId) {
      console.error('No participant ID for loading page');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('survey-load', {
        body: { participant_id: this.participantId, page_id: pageId }
      });

      if (error || !data?.ok) {
        console.error('Failed to load page:', error || data?.error);
        return null;
      }

      return data.answers;
    } catch (error) {
      console.error('Load page error:', error);
      return null;
    }
  }

  async confirmConsent(): Promise<string | null> {
    if (!this.participantId) {
      console.error('No participant ID for consent confirmation');
      return null;
    }

    try {
      // Clear local storage
      this.clearLocalAnswers();
      
      const { data, error } = await supabase.functions.invoke('consent-confirm', {
        body: { participant_id: this.participantId }
      });

      if (error || !data?.ok) {
        console.error('Failed to confirm consent:', error || data?.error);
        return null;
      }

      this.sessionId = data.session_id;
      this.saveToStorage();
      
      // Start session timing
      await this.startSessionTiming();
      
      return this.sessionId;
    } catch (error) {
      console.error('Consent confirm error:', error);
      return null;
    }
  }

  async endSession(): Promise<boolean> {
    if (!this.participantId) {
      console.error('No participant ID for ending session');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('session-end-new', {
        body: { participant_id: this.participantId }
      });

      if (error || !data?.ok) {
        console.error('Failed to end session:', error || data?.error);
        return false;
      }

      // End session timing
      await this.endSessionTiming();
      
      this.clearStorage();
      return true;
    } catch (error) {
      console.error('End session error:', error);
      return false;
    }
  }

  async saveResultLog(q11: string, q12: string, q13: string, q14: string, q15: string): Promise<boolean> {
    console.log('🔍 saveResultLog called with:', { q11, q12, q13, q14, q15 });
    
    if (!this.participantId || !this.sessionId) {
      console.error('❌ Missing participant ID or session ID for result log');
      console.error('Debug - participantId:', this.participantId);
      console.error('Debug - sessionId:', this.sessionId);
      return false;
    }

    console.log('📡 Calling result-log Edge Function with:', {
      participant_id: this.participantId,
      session_id: this.sessionId,
      q11_answer: q11,
      q12_answer: q12,
      q13_answer: q13,
      q14_answer: q14,
      q15_answer: q15
    });

    try {
      const { data, error } = await supabase.functions.invoke('result-log', {
        body: { 
          participant_id: this.participantId,
          session_id: this.sessionId,
          q11_answer: q11,
          q12_answer: q12,
          q13_answer: q13,
          q14_answer: q14,
          q15_answer: q15
        }
      });

      if (error || !data?.ok) {
        console.error('❌ Failed to save result log:', error || data?.error);
        return false;
      }

      console.log('✅ Result log saved successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Save result log error:', error);
      return false;
    }
  }

  private async startSessionTiming(): Promise<void> {
    // This is now handled in consent-confirm endpoint
    // But we could track the timing ID if needed
  }

  private async endSessionTiming(): Promise<void> {
    // This is now handled in session-end-new endpoint
    // The session timing table is updated automatically
  }

  private clearLocalAnswers(): void {
    // Clear all local survey answer storage
    localStorage.removeItem('background_survey_data');
    localStorage.removeItem('post_task_survey_data');
    localStorage.removeItem('search_result_log_data');
    localStorage.removeItem('task_instruction_data');
  }
}

export const sessionManager = new SessionManager();
