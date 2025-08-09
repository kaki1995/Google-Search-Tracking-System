// Quick database connection test
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

const supabaseUrl = 'https://wbguuipoggeamyzrfvbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ3d1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMDk1NjgsImV4cCI6MjA0OTY4NTU2OH0.Jl2nXPPKMCdVzaGTzBfnolr0vNDsYpk2dCRPCWYm7vU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Checking database records...');
    
    try {
        // Check interactions table
        const { data: interactions, error: intError } = await supabase
            .from('interactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        console.log('📊 Interactions:', interactions?.length || 0, 'records');
        if (interactions && interactions.length > 0) {
            console.log('Latest interaction:', interactions[0]);
        }
        
        // Check interaction_details table
        const { data: details, error: detError } = await supabase
            .from('interaction_details')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        console.log('📋 Interaction Details:', details?.length || 0, 'records');
        if (details && details.length > 0) {
            console.log('Latest detail:', details[0]);
        }
        
        // Check query_timing_metrics table
        const { data: timing, error: timError } = await supabase
            .from('query_timing_metrics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        console.log('⏱️ Timing Metrics:', timing?.length || 0, 'records');
        if (timing && timing.length > 0) {
            console.log('Latest timing:', timing[0]);
        }
        
        // Check for today's records
        const today = new Date().toISOString().split('T')[0];
        const { data: todayRecords } = await supabase
            .from('interactions')
            .select('*')
            .gte('created_at', today);
            
        console.log(`📅 Today's interactions: ${todayRecords?.length || 0}`);
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
    }
}

checkDatabase();
