// Test Background Survey Database Recording with Updated Component
console.log('🧪 Testing Updated Background Survey Component...');

// Simulate the exact data structure the component sends
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
    q2_gender: 'female',
    q3_education: 'master',
    q4_employment_status: 'employed',
    q5_nationality: 'German',
    q6_country_residence: 'Germany',
    q7_ai_familiarity: 6,
    q8_attention_check: 1, // Proper attention check response
    q9_ai_usage_frequency: '6-10-times'
  }
};

const SUPABASE_URL = 'https://wbguuipoggeamyzrfvbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM1Mzg5NzAsImV4cCI6MjAzOTExNDk3MH0.uOsgjIH_pHIeEGdFR8LFKITm0OGF4TkhAjqpI1cOBCo';

async function testBackgroundSurveyRecording() {
  try {
    console.log('📊 Testing Background Survey Database Recording...');
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
      console.log('✅ BACKGROUND SURVEY DATABASE RECORDING WORKING!');
      console.log('✅ Your updated component will now record to database');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('   1. Fill out the Background Survey in your app');
      console.log('   2. Click "Next Page" (this now submits to database)');
      console.log('   3. Check your Supabase dashboard for the new record');
      console.log('');
      console.log('🔍 Look for these console messages in your app:');
      console.log('   • "BackgroundSurvey: onSubmit called with data:"');
      console.log('   • "BackgroundSurvey: submission successful"');
      
    } else {
      console.log('❌ Background survey recording test FAILED');
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

console.log('🚀 Testing database recording functionality...');
testBackgroundSurveyRecording();
