// Quick test to check localStorage persistence
console.log('=== localStorage Persistence Test ===');

// Check current participant ID
const participantId = localStorage.getItem('participant_id');
console.log('Current participant ID:', participantId);

// Check all localStorage keys
console.log('All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`${key}: ${localStorage.getItem(key)}`);
}

// Test saving data manually
const testData = { age: '25-34', gender: 'male' };
const storageKey = 'background_survey_responses';
const saveData = {
  data: testData,
  timestamp: new Date().toISOString(),
  participantId: participantId
};

localStorage.setItem(storageKey, JSON.stringify(saveData));
console.log('Test data saved. Check if it persists...');

// Verify the save
const retrieved = localStorage.getItem(storageKey);
console.log('Retrieved test data:', retrieved);
