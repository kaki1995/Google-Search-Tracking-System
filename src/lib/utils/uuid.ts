/**
 * Generate a proper UUID v4 format
 * Uses crypto.randomUUID() if available, falls back to manual generation
 */
export function generateUUID(): string {
  if ((crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  } else {
    // Fallback: create a UUID v4 format manually
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/**
 * Check if a string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-fA-F-]{36}$/.test(uuid);
}

/**
 * Get or create participant ID
 * Returns existing participant ID from localStorage or creates a new one
 * Validates existing ID and regenerates if invalid
 */
export function getOrCreateParticipantId(): string {
  let participant_id = localStorage.getItem('participant_id');
  
  // Check if existing ID is valid, if not, clear it
  if (participant_id && !isValidUUID(participant_id)) {
    console.log('Invalid participant_id detected, clearing:', participant_id);
    localStorage.removeItem('participant_id');
    participant_id = null;
  }
  
  if (!participant_id) {
    participant_id = generateUUID();
    localStorage.setItem('participant_id', participant_id);
    console.log('Generated new participant_id:', participant_id);
  }
  
  return participant_id;
}
