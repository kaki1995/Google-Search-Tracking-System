// Test Supabase connection and search_result_log table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wbguuipoggeamyzrfvbv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    try {
        // Test connection with a known table
        console.log('📊 Testing connection with search_sessions table...');
        
        const { data: connectionTest, error: connectionError } = await supabase
            .from('search_sessions')
            .select('id')
            .limit(1);

        if (connectionError) {
            console.log('❌ Connection error:', connectionError.message);
            return;
        }

        console.log('✅ Supabase connection working');

        // Test search_result_log table
        console.log('\n📊 Testing search_result_log table...');
        
        const { data: resultLogTest, error: resultLogError } = await supabase
            .from('search_result_log')
            .select('*')
            .limit(1);

        if (resultLogError) {
            console.log('❌ search_result_log table error:', resultLogError.message);
            console.log('This might mean the table does not exist yet');
            
            // Check available tables
            console.log('\n📋 Checking what tables are available...');
            const tables = ['search_sessions', 'background_surveys', 'participants', 'post_survey', 'post_task_survey'];
            
            for (const table of tables) {
                try {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .limit(1);
                    
                    if (!error) {
                        console.log(`✅ Table "${table}" exists and is accessible`);
                    } else {
                        console.log(`❌ Table "${table}" error: ${error.message}`);
                    }
                } catch (e) {
                    console.log(`❌ Table "${table}" exception: ${e.message}`);
                }
            }
            return;
        }

        console.log('✅ search_result_log table is accessible');
        console.log('Found records:', resultLogTest?.length || 0);

        if (resultLogTest && resultLogTest.length > 0) {
            console.log('Sample record:', JSON.stringify(resultLogTest[0], null, 2));
        }

        console.log('\n🎉 SUCCESS: search_result_log table exists and is working!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testSupabaseConnection().then(() => {
    console.log('\nConnection test completed.');
}).catch(console.error);
