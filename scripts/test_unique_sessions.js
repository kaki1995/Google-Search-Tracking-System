// Script to test the new unique session-based participant ID system
const fetch = global.fetch || require('node-fetch');

function generateUniqueParticipantId() {
  // Generate a proper UUID format for database compatibility
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

(async () => {
  const SUPABASE_URL = 'https://wbguuipoggeamyzrfvbv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY';

  console.log('🧪 Testing new unique session-based participant ID system\n');

  // Simulate multiple users on same device
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Session ${i} (User ${i} on same device) ---`);
    
    // 1. Generate unique participant ID (like Welcome page would do)
    const participant_id = generateUniqueParticipantId();
    console.log('1. Generated unique participant_id:', participant_id);

    // 2. Create session via consent-confirm
    console.log('2. Creating session via consent-confirm...');
    const consentRes = await fetch(`${SUPABASE_URL}/functions/v1/consent-confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ participant_id })
    });
    
    const consentData = await consentRes.json();
    console.log('   Consent response:', consentData);
    
    if (consentData.ok && consentData.session_id) {
      const session_id = consentData.session_id;
      
      // 3. Submit background survey
      console.log('3. Submitting background survey...');
      const bgRes = await fetch(`${SUPABASE_URL}/functions/v1/submit-background-survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          participant_id,
          responses: {
            q1_age_group: '25-34',
            q2_gender: 'prefer_not_to_say',
            q3_education: 'bachelor',
            q4_employment_status: 'employed',
            q5_nationality: 'German',
            q6_country_residence: 'Germany',
            q7_ai_familiarity: 4,
            q8_attention_check: 1,
            q9_ai_usage_frequency: 'daily'
          }
        })
      });
      
      const bgData = await bgRes.json();
      console.log('   Background survey response:', bgData);
      
      // 4. Submit Q11-15 data
      console.log('4. Submitting Q11-15 data...');
      const resultRes = await fetch(`${SUPABASE_URL}/functions/v1/result-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          participant_id,
          session_id,
          q11_answer: `Test Phone ${i}`,
          q12_answer: '128GB',
          q13_answer: 'Blue',
          q14_answer: `$${500 + i * 100}`,
          q15_answer: `https://example.com/phone${i}`
        })
      });
      
      const resultData = await resultRes.json();
      console.log('   Q11-15 response:', resultData);
      
      console.log(`✅ Session ${i} completed successfully!`);
    } else {
      console.log(`❌ Session ${i} failed at consent step`);
    }
    
    // Wait a bit between sessions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 Test completed! Each session should have unique participant_id');
  console.log('Check your Supabase database for 3 different participants with their data');
})();
