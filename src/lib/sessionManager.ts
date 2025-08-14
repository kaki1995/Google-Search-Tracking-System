// Session management utilities for participant-based tracking
import { supabase } from "@/integrations/supabase/client";

export interface SessionData {
  participant_id: string;
  session_id: string;
}

export class SessionManager {
  private participant_id: string | null = null;
  private session_id: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    this.participant_id = localStorage.getItem('participant_id');
    this.session_id = localStorage.getItem('session_id');
  }

  private saveToStorage(): void {
    if (this.participant_id) {
      localStorage.setItem('participant_id', this.participant_id);
    }
    if (this.session_id) {
      localStorage.setItem('session_id', this.session_id);
    }
  }

  getParticipantId(): string {
    if (!this.participant_id) {
      this.participant_id = crypto.randomUUID();
      this.saveToStorage();
    }
    return this.participant_id;
  }

  getSessionId(): string | null {
    return this.session_id;
  }

  getSessionData(): SessionData {
    return {
      participant_id: this.getParticipantId(),
      session_id: this.session_id || ''
    };
  }

  async ensureSession(): Promise<string> {
    const participant_id = this.getParticipantId();
    
    try {
      const { data, error } = await supabase.functions.invoke('session-ensure', {
        body: { participant_id }
      });

      if (error || !data?.ok) {
        throw new Error(data?.error || 'Failed to ensure session');
      }

      this.session_id = data.session_id;
      this.saveToStorage();
      
      return this.session_id;
    } catch (error) {
      console.error('Session ensure error:', error);
      throw error;
    }
  }

  async confirmConsent(): Promise<string> {
    const participant_id = this.getParticipantId();
    
    try {
      const { data, error } = await supabase.functions.invoke('consent-confirm', {
        body: { participant_id }
      });

      if (error || !data?.ok) {
        throw new Error(data?.error || 'Failed to confirm consent');
      }

      this.session_id = data.session_id;
      this.saveToStorage();
      
      // Clear any saved form data to start fresh
      this.clearSavedForms();
      
      return this.session_id;
    } catch (error) {
      console.error('Consent confirm error:', error);
      throw error;
    }
  }

  async endSession(): Promise<void> {
    if (!this.participant_id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('session-end-new', {
        body: { participant_id: this.participant_id }
      });

      if (error || !data?.ok) {
        console.error('Failed to end session:', data?.error || error?.message);
      }

      // Clear session data
      this.session_id = null;
      localStorage.removeItem('session_id');
    } catch (error) {
      console.error('Session end error:', error);
    }
  }

  savePage(pageId: string, answers: Record<string, any>): void {
    const key = `survey_${pageId}_${this.getParticipantId()}`;
    localStorage.setItem(key, JSON.stringify(answers));
  }

  loadPage(pageId: string): Record<string, any> | null {
    const key = `survey_${pageId}_${this.getParticipantId()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }

  clearSavedForms(): void {
    const participant_id = this.getParticipantId();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`survey_`) && key.endsWith(`_${participant_id}`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clear old format survey data
    localStorage.removeItem('background_survey_data');
    localStorage.removeItem('post_task_survey_data');
  }
}

export const sessionManager = new SessionManager();