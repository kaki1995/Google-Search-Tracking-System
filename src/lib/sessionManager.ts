import { supabase } from "@/integrations/supabase/client";

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
    
    // Update the main session data
    if (this.participantId) {
      const sessionData = {
        participantId: this.participantId,
        sessionId: this.sessionId,
        sessionTimingId: this.sessionTimingId,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('google_search_session', JSON.stringify(sessionData));
    }
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

  // Generate a unique participant ID for each new session (supports multiple users per device)
  private generateUniqueParticipantId(): string {
    // Generate a proper UUID for database compatibility
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Clear all session data to start fresh
  clearSession(): void {
    this.participantId = null;
    this.sessionId = null;
    this.sessionTimingId = null;
    localStorage.removeItem('participant_id');
    localStorage.removeItem('session_id');
    localStorage.removeItem('session_timing_id');
    localStorage.removeItem('google_search_session');
    this.clearAllResponses();
  }

  // Create new session - only called after consent confirmation
  createNewSession(): string {
    // Always generate a new unique participant ID for each session
    this.participantId = this.generateUniqueParticipantId();
    this.sessionId = null; // Will be set when confirmConsent is called
    this.sessionTimingId = null;
    
    // Save the new participant ID
    localStorage.setItem('participant_id', this.participantId);
    
    // Store session info for cross-tab consistency
    const sessionData = {
      participantId: this.participantId,
      sessionId: this.sessionId,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('google_search_session', JSON.stringify(sessionData));
    
    console.log('🆕 New session created with participant_id:', this.participantId);
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
      // Try new save-responses function first
      const { data, error } = await supabase.functions.invoke('save-responses', {
        body: { 
          participant_id: this.participantId, 
          page_id: pageId, 
          response_data: answers,
          session_id: this.sessionId 
        }
      });

      if (error || !data?.ok) {
        console.warn('New save-responses function not available, using fallback');
        // Fallback to localStorage only for now
        const storageKey = `${pageId}_responses`;
        localStorage.setItem(storageKey, JSON.stringify({
          data: answers,
          timestamp: new Date().toISOString(),
          participantId: this.participantId
        }));
        return true;
      }

      return true;
    } catch (error) {
      console.warn('Save page error, using localStorage fallback:', error);
      // Fallback to localStorage
      const storageKey = `${pageId}_responses`;
      localStorage.setItem(storageKey, JSON.stringify({
        data: answers,
        timestamp: new Date().toISOString(),
        participantId: this.participantId
      }));
      return true;
    }
  }

  async loadPage(pageId: string): Promise<Record<string, any> | null> {
    if (!this.participantId) {
      console.error('No participant ID for loading page');
      return null;
    }

    try {
      // Try new load-responses function first
      const { data, error } = await supabase.functions.invoke('load-responses', {
        body: { participant_id: this.participantId, page_id: pageId }
      });

      if (error || !data?.ok) {
        console.warn('New load-responses function not available, using fallback');
        // Fallback to localStorage
        const storageKey = `${pageId}_responses`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.participantId === this.participantId) {
              return parsed.data;
            }
          } catch (e) {
            console.error('Error parsing localStorage data:', e);
          }
        }
        return null;
      }

      return data.data?.response_data || null;
    } catch (error) {
      console.warn('Load page error, using localStorage fallback:', error);
      // Fallback to localStorage
      const storageKey = `${pageId}_responses`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.participantId === this.participantId) {
            return parsed.data;
          }
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
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

  // Enhanced response persistence methods
  
  // Build participant-scoped storage key (new format)
  private buildResponseKey(pageId: string): string | null {
    if (!this.participantId) return null;
    return `${this.participantId}:${pageId}_responses`;
  }

  // Legacy (old) unscoped key
  private buildLegacyResponseKey(pageId: string): string {
    return `${pageId}_responses`;
  }

  // Save responses for a specific page/component with automatic debouncing
  async saveResponses(pageId: string, responses: Record<string, any>): Promise<void> {
    if (!this.participantId) {
      console.warn('SessionManager: No participant ID available for saving responses');
      return;
    }

    try {
      const newKey = this.buildResponseKey(pageId);
      const legacyKey = this.buildLegacyResponseKey(pageId);
      const saveData = {
        data: responses,
        timestamp: new Date().toISOString(),
        participantId: this.participantId
      };

      if (newKey) {
        console.log(`💾 SessionManager: Saving (scoped) with key: ${newKey}`);
        localStorage.setItem(newKey, JSON.stringify(saveData));
      }

      // Maintain legacy key for backward compatibility (lightweight duplicate)
      console.log(`💾 SessionManager: Saving (legacy) with key: ${legacyKey}`);
      localStorage.setItem(legacyKey, JSON.stringify(saveData));

      console.log(`✅ SessionManager: Responses saved for ${pageId}`);
      
      // TODO: Also save to backend when edge functions are deployed
      // await this.savePage(pageId, responses);
    } catch (error) {
      console.error(`Failed to save responses for ${pageId}:`, error);
    }
  }

  // Load responses for a specific page/component
  async loadResponses(pageId: string): Promise<Record<string, any> | null> {
    try {
      const newKey = this.buildResponseKey(pageId);
      const legacyKey = this.buildLegacyResponseKey(pageId);
      console.log(`🔍 SessionManager: Attempt load (scoped) key: ${newKey}`);
      console.log(`🔍 SessionManager: Attempt load (legacy) key: ${legacyKey}`);

      const tryKeys = [newKey, legacyKey].filter(Boolean) as string[];
      for (const key of tryKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
            // If participantId mismatch on legacy key, skip but don't delete (avoid data loss)
            if (parsed.participantId && this.participantId && parsed.participantId !== this.participantId) {
              console.warn(`⚠️ SessionManager: Participant mismatch for key ${key}. Expected ${this.participantId}, found ${parsed.participantId}. Skipping.`);
              continue;
            }
            console.log(`✅ SessionManager: Loaded responses from key ${key}`);
            return parsed.data || null;
        } catch (e) {
          console.error(`❌ SessionManager: Failed parsing data for key ${key}:`, e);
        }
      }

      console.log(`📭 SessionManager: No saved responses found for ${pageId}`);
      return null;
    } catch (error) {
      console.error(`Failed to load responses for ${pageId}:`, error);
      return null;
    }
  }

  // Clear responses for a specific page
  clearResponses(pageId: string): void {
    const storageKey = `${pageId}_responses`;
    localStorage.removeItem(storageKey);
    
    // Also clear the old format for backwards compatibility
    const oldKeys = [
      'background_survey_data',
      'post_task_survey_data', 
      'search_result_log_data',
      'task_instruction_data'
    ];
    
    if (oldKeys.includes(`${pageId}_data`)) {
      localStorage.removeItem(`${pageId}_data`);
    }
    
    console.log(`🗑️ Cleared responses for ${pageId}`);
  }

  // Clear all response data (called when session ends or user exits)
  clearAllResponses(): void {
    const responseKeys = [
      'background_survey_responses',
      'post_task_survey_responses',
      'search_result_log_responses', 
      'task_instruction_responses',
      // Backwards compatibility
      'background_survey_data',
      'post_task_survey_data',
      'search_result_log_data',
      'task_instruction_data'
    ];
    
    responseKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🗑️ All response data cleared');
  }

  // Check if responses exist for a page (useful for showing "Continue" vs "Start" buttons)
  hasResponses(pageId: string): boolean {
    const keysToCheck: string[] = [];
    const newKey = this.buildResponseKey(pageId);
    if (newKey) keysToCheck.push(newKey);
    keysToCheck.push(this.buildLegacyResponseKey(pageId));
    for (const key of keysToCheck) {
      const savedData = localStorage.getItem(key);
      if (!savedData) continue;
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.data && Object.keys(parsed.data).length > 0) return true;
      } catch {/* ignore */}
    }
    // Old legacy *_data format
    return !!localStorage.getItem(`${pageId}_data`);
  }

  // Get a summary of all saved responses (useful for debugging)
  getResponsesSummary(): Record<string, any> {
    const pages = ['background_survey', 'task_instruction', 'search_result_log', 'post_task_survey'];
    const summary: Record<string, any> = {};
    
    pages.forEach(pageId => {
      const storageKey = `${pageId}_responses`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          summary[pageId] = {
            hasData: Object.keys(parsed.data || {}).length > 0,
            timestamp: parsed.timestamp,
            participantId: parsed.participantId
          };
        } catch {
          summary[pageId] = { hasData: false, error: 'Invalid JSON' };
        }
      } else {
        summary[pageId] = { hasData: false };
      }
    });
    
    return summary;
  }

  private clearLocalAnswers(): void {
    // Use the enhanced clearAllResponses method
    this.clearAllResponses();
  }
}

export const sessionManager = new SessionManager();
