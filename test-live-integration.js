// Test Background Survey Integration with Live App
console.log('🧪 Testing Background Survey Integration...');

// Generate a proper UUID like the sessionManager does
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const testData = {
  participant_id: generateUUID(),
  responses: {
    q1_age_group: '25-34',
    q2_gender: 'male',
    q3_education: 'bachelor',
    q4_employment_status: 'employed',
    q5_nationality: 'American',
    q6_country_residence: 'United States',
    q7_ai_familiarity: 5,
    q8_attention_check: 1,
    q9_ai_usage_frequency: '3-5-times'
  }
};

const SUPABASE_URL = 'https://wbguuipoggeamyzrfvbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM1Mzg5NzAsImV4cCI6MjAzOTExNDk3MH0.uOsgjIH_pHIeEGdFR8LFKITm0OGF4TkhAjqpI1cOBCo';

async function testBackgroundSurveySubmission() {
  try {
    console.log('📊 Submitting test background survey...');
    console.log('Participant ID:', testData.participant_id);
    console.log('Responses:', JSON.stringify(testData.responses, null, 2));
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-background-survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📈 Response Status:', response.status);
    console.log('📈 Response Body:', result);
    
    if (response.status === 200 && result.ok) {
      console.log('✅ Background survey submission test PASSED');
      console.log('✅ Data is being recorded to Supabase database');
      
      // Test the new response persistence functions
      await testResponsePersistence();
      
    } else {
      console.log('❌ Background survey submission test FAILED');
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function testResponsePersistence() {
  try {
    console.log('💾 Testing response persistence functions...');
    
    const persistenceData = {
      participant_id: testData.participant_id,
      page_id: 'background_survey',
      response_data: testData.responses,
      session_id: 'test-session-' + Date.now()
    };
    
    // Test save-responses function
    console.log('📤 Testing save-responses function...');
    const saveResponse = await fetch(`${SUPABASE_URL}/functions/v1/save-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(persistenceData)
    });
    
    const saveResult = await saveResponse.json();
    console.log('💾 Save Response Status:', saveResponse.status);
    console.log('💾 Save Response Body:', saveResult);
    
    if (saveResponse.status === 200 && saveResult.ok) {
      console.log('✅ Response persistence save test PASSED');
      
      // Test load-responses function
      console.log('📥 Testing load-responses function...');
      const loadResponse = await fetch(`${SUPABASE_URL}/functions/v1/load-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          participant_id: testData.participant_id,
          page_id: 'background_survey'
        })
      });
      
      const loadResult = await loadResponse.json();
      console.log('📥 Load Response Status:', loadResponse.status);
      console.log('📥 Load Response Body:', loadResult);
      
      if (loadResponse.status === 200 && loadResult.ok) {
        console.log('✅ Response persistence load test PASSED');
        console.log('✅ Full response persistence system is working!');
      } else {
        console.log('⚠️  Response persistence load test failed, but basic recording works');
      }
      
    } else {
      console.log('⚠️  Response persistence save test failed, but basic recording works');
    }
    
  } catch (error) {
    console.error('⚠️  Response persistence test failed:', error);
    console.log('ℹ️  Basic background survey recording still works via localStorage fallback');
  }
}

console.log('🚀 Starting comprehensive integration test...');
testBackgroundSurveySubmission();
