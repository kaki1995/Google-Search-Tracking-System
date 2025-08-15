// Test the response persistence directly
console.log('=== Testing Response Persistence ===');

// Test 1: Check localStorage directly
function testLocalStorage() {
    console.log('\n1. Testing localStorage:');
    
    // Save test data
    const testData = {
        age: "25-34",
        gender: "female",
        education: "masters"
    };
    
    const saveData = {
        data: testData,
        timestamp: new Date().toISOString(),
        participantId: 'test-123'
    };
    
    localStorage.setItem('participant_id', 'test-123');
    localStorage.setItem('background_survey_responses', JSON.stringify(saveData));
    
    console.log('✅ Saved test data');
    
    // Retrieve test data
    const retrieved = localStorage.getItem('background_survey_responses');
    if (retrieved) {
        const parsed = JSON.parse(retrieved);
        console.log('✅ Retrieved data:', parsed.data);
        return parsed.data;
    } else {
        console.log('❌ Failed to retrieve data');
        return null;
    }
}

// Test 2: Check sessionManager
function testSessionManager() {
    console.log('\n2. Testing sessionManager:');
    
    // Try to access sessionManager (this should be available in the app)
    if (typeof window !== 'undefined' && window.sessionManager) {
        console.log('✅ sessionManager found');
        
        const participantId = window.sessionManager.getParticipantId();
        console.log('Participant ID:', participantId);
        
        // Try to load responses
        window.sessionManager.loadResponses('background_survey').then(data => {
            console.log('sessionManager.loadResponses result:', data);
        });
    } else {
        console.log('❌ sessionManager not found on window');
    }
}

// Run tests
const testResult = testLocalStorage();
testSessionManager();

console.log('\n=== Test Complete ===');
console.log('If you see this in the browser console, copy these messages and tell me what happened!');
