// Simple node script to invoke the Supabase Edge Function and print the response
const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const SUPABASE_URL = 'https://wbguuipoggeamyzrfvbv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY';

    function generateUUID() {
      if (typeof crypto !== 'undefined' && (crypto.randomUUID)) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    const participant_id = generateUUID();

    const payload = {
      participant_id,
      responses: {
        q1_age_group: '25-34',
        q2_gender: 'male',
        q3_education: 'bachelor',
        q4_employment_status: 'employed',
        q5_nationality: 'German',
        q6_country_residence: 'Germany',
        q7_ai_familiarity: 5,
        q8_attention_check: 1,
        q9_ai_usage_frequency: '3-5-times'
      }
    };

    console.log('Invoking function with participant_id:', participant_id);

    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-background-survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('HTTP status:', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('Invocation error:', err);
    process.exitCode = 1;
  }
})();
