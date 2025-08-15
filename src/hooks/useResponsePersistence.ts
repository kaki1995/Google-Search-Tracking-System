import { useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { sessionManager } from '@/lib/sessionManager';

/**
 * Custom hook for automatic response persistence in survey forms
 * Automatically saves form data when values change and loads saved data on mount
 */
export function useResponsePersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  pageId: string,
  options: {
    autosave?: boolean; // Whether to automatically save on form changes (default: true)
    debounceMs?: number; // Debounce delay for autosave (default: 500ms)
  } = {}
) {
  const { autosave = true, debounceMs = 500 } = options;

  const lastSavedRef = useRef<string>("{}");

  // Load saved responses on component mount
  useEffect(() => {
    const loadSavedResponses = async () => {
      try {
        // Wait a bit to ensure participant ID is set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const participantId = sessionManager.getParticipantId();
        if (!participantId) {
          console.log(`⚠️ No participant ID available for loading ${pageId} responses`);
          return;
        }
        
        const savedData = await sessionManager.loadResponses(pageId);
        
        if (savedData && Object.keys(savedData).length > 0) {
          // Reset form with saved data - this is the key part
          form.reset(savedData as T);
          try { lastSavedRef.current = JSON.stringify(savedData); } catch {}
        } else {
          // no saved data
        }
      } catch (error) {
        console.error(`❌ [${pageId}] Failed to load saved responses:`, error);
      }
    };

    loadSavedResponses();
  }, [form, pageId]);

  // Auto-save form responses when values change (only if autosave is enabled)
  useEffect(() => {
    if (!autosave) {
      console.log(`⚠️ Auto-save disabled for ${pageId}`);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const subscription = form.watch((values) => {
      // Skip if identical snapshot
      try {
        const json = JSON.stringify(values);
        if (json === lastSavedRef.current) return;
      } catch {}

      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce the save operation
      timeoutId = setTimeout(async () => {
        try {
          // Only save if there are actual values
          const hasValues = Object.values(values || {}).some(value => 
            value !== '' && value !== null && value !== undefined
          );

          if (hasValues) {
            const json = JSON.stringify(values);
            if (json !== lastSavedRef.current) {
              await sessionManager.saveResponses(pageId, values);
              lastSavedRef.current = json;
            }
          } else {
            // all empty – skip
          }
        } catch (error) {
          console.error(`❌ [${pageId}] Failed to auto-save responses:`, error);
        }
      }, debounceMs);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [form, pageId, autosave, debounceMs]);

  // Manual save function
  const saveResponses = async (data?: T) => {
    try {
      const values = data || form.getValues();
      const json = JSON.stringify(values);
      if (json !== lastSavedRef.current) {
        await sessionManager.saveResponses(pageId, values);
        lastSavedRef.current = json;
      }
    } catch (error) {
      console.error(`❌ [${pageId}] Failed to manually save responses:`, error);
      throw error;
    }
  };

  // Clear saved responses
  const clearResponses = () => {
  sessionManager.clearResponses(pageId);
  form.reset();
  lastSavedRef.current = "{}";
  };

  // Check if responses exist
  const hasResponses = () => {
    return sessionManager.hasResponses(pageId);
  };

  return {
    saveResponses,
    clearResponses,
    hasResponses
  };
}

export default useResponsePersistence;
