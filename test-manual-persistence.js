// Test script to manually check response persistence
const participantId = '12345678-1234-1234-1234-123456789012';

// Set a participant ID in sessionStorage
localStorage.setItem('participant_id', participantId);

// Create some test background survey responses
const testResponses = {
  age: "25-34",
  gender: "male",
  education: "bachelors",
  employment: "full-time",
  nationality: "US",
  country: "US",
  experience_scale_q7: "4",
  familiarity_scale_q8: "3",
  search_frequency: "daily"
};

// Save using the same format as sessionManager
const saveData = {
  data: testResponses,
  timestamp: new Date().toISOString(),
  participantId: participantId
};

localStorage.setItem('background_survey_responses', JSON.stringify(saveData));

console.log('✅ Test data saved to localStorage');
console.log('📋 Saved data:', saveData);

// Test retrieval
const retrieved = localStorage.getItem('background_survey_responses');
if (retrieved) {
  const parsed = JSON.parse(retrieved);
  console.log('✅ Retrieved data:', parsed.data);
} else {
  console.log('❌ Failed to retrieve data');
}

console.log('Now go to Background Survey to see if this data loads');
