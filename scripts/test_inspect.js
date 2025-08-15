// Script to test the result-log-inspect function
const fetch = global.fetch || require('node-fetch');

(async () => {
  const SUPABASE_URL = 'https://wbguuipoggeamyzrfvbv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY';

  console.log('Testing result-log-inspect function...');
  
  const res = await fetch(`${SUPABASE_URL}/functions/v1/result-log-inspect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ 
      participant_id: "7b3e7955-09e4-4f4b-ba04-4d6351730027", // From the last test
      limit: 3
    })
  });

  const text = await res.text();
  console.log('Inspect status:', res.status);
  console.log('Inspect response:', text);
})();
