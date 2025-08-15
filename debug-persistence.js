// Quick test to debug response persistence
console.log('=== Response Persistence Debug Test ===');

// Test localStorage directly
function testLocalStorage() {
    console.log('1. Testing localStorage directly...');
    
    // Set a participant ID
    const testParticipantId = 'test-participant-123';
    localStorage.setItem('participant_id', testParticipantId);
    console.log('✅ Set participant ID:', testParticipantId);
    
    // Create test data
    const testData = {
        age: "25-34",
        gender: "male",
        education: "bachelors"
    };
    
    const saveData = {
        data: testData,
        timestamp: new Date().toISOString(),
        participantId: testParticipantId
    };
    
    // Save to localStorage
    localStorage.setItem('background_survey_responses', JSON.stringify(saveData));
    console.log('✅ Saved test data:', testData);
    
    // Try to retrieve
    const retrieved = localStorage.getItem('background_survey_responses');
    if (retrieved) {
        const parsed = JSON.parse(retrieved);
        console.log('✅ Retrieved data:', parsed.data);
        console.log('✅ Participant ID matches:', parsed.participantId === testParticipantId);
    } else {
        console.log('❌ No data retrieved');
    }
}

testLocalStorage();

// Check what's currently in localStorage
console.log('\n2. Current localStorage contents:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value}`);
}

console.log('\n✅ Test completed. Now go to the Background Survey to test real persistence.');
