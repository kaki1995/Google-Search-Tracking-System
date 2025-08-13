import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
export const supabaseServer = createClient(
  'https://wbguuipoggeamyzrfvbv.supabase.co',
  // Note: In production, this should come from environment variables
  // For now using the service role key directly
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc3NzY5OSwiZXhwIjoyMDY5MzUzNjk5fQ.FGpqPsrQfGz4z5pFELyKAj5PKkKU_wYqMDqWE1dJBIQ',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);