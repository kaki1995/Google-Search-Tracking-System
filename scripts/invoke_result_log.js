// Node script to test the result-log Edge Function end-to-end
// Uses a real-looking UUID participant and session id. Adjust SUPABASE_URL/KEY to match your deployed project.

const fetch = global.fetch || require('node-fetch');

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

(async () => {
  // Use the same remote project as background survey script for consistency
  const SUPABASE_URL = 'https://wbguuipoggeamyzrfvbv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY';

  // 1. Create (or ensure) participant via background survey function first (so FK passes)
  const participant_id = generateUUID();
  console.log('\n[1] Creating participant via background survey function:', participant_id);
  const backgroundPayload = {
    participant_id,
    responses: {
      q1_age_group: '25-34',
      q2_gender: 'male',
      q3_education: 'bachelor',
      q4_employment_status: 'employed',
      q5_nationality: 'German',
      q6_country_residence: 'Germany',
      q7_ai_familiarity: 4,
      q8_attention_check: 1,
      q9_ai_usage_frequency: 'daily'
    }
  };
  let res = await fetch(`${SUPABASE_URL}/functions/v1/submit-background-survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(backgroundPayload)
  });
  let text = await res.text();
  console.log(' Background survey status:', res.status, 'body:', text);

  // 2. Start a consent/session if required (invoke consent-confirm) to get a session_id
  console.log('\n[2] Starting session via consent-confirm');
  res = await fetch(`${SUPABASE_URL}/functions/v1/consent-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ participant_id })
  });
  text = await res.text();
  console.log(' Consent confirm status:', res.status, 'body:', text);
  let session_id = null;
  try { session_id = JSON.parse(text).session_id; } catch {}
  if (!session_id) {
    console.error('❌ Could not obtain session_id. Cannot continue.');
    process.exit(1);
  }
  console.log(' Obtained session_id:', session_id);

  // 3. Invoke result-log function
  console.log('\n[3] Invoking result-log with Q11-Q15 answers');
  const resultPayload = {
    participant_id,
    session_id,
    q11_answer: 'iPhone 15 Pro',
    q12_answer: '256GB',
    q13_answer: 'Blue',
    q14_answer: '$1099',
    q15_answer: 'https://apple.com/iphone15-pro'
  };
  res = await fetch(`${SUPABASE_URL}/functions/v1/result-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(resultPayload)
  });
  text = await res.text();
  console.log(' Result-log status:', res.status, 'body:', text);

  // 4. Try to read back (may fail due to RLS)
  console.log('\n[4] Attempt direct table read (may be blocked by RLS)');
  res = await fetch(`${SUPABASE_URL}/rest/v1/search_result_log?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  text = await res.text();
  console.log(' Direct read status:', res.status, 'body length:', text.length);
  console.log(' Body sample:', text.slice(0, 400));

  console.log('\nDone. If result-log returned ok:true, insertion succeeded even if direct read is blocked.');
})();
