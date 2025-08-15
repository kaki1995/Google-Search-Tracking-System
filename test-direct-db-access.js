// Simple database test for Questions 11-15 storage
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wbguuipoggeamyzrfvbv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3V1aXBvZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzc2OTksImV4cCI6MjA2OTM1MzY5OX0.ddgmJnxg6hipRZ8_r9WyQpvsM-pkhBlRoybPdtGPEtY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDirectDatabaseAccess() {
    console.log('🔍 Testing Direct Database Access for Questions 11-15...\n');

    try {
        // Test 1: Check if table exists
        console.log('📊 Step 1: Checking if search_result_log table exists...');
        
        const { data: tableCheck, error: tableError } = await supabase
            .from('search_result_log')
            .select('*')
            .limit(1);

        if (tableError) {
            console.log('❌ Table access error:', tableError.message);
            console.log('Table may not exist or RLS policies may be blocking access');
            return;
        }

        console.log('✅ search_result_log table is accessible');

        // Test 2: Try direct insert
        console.log('\n📤 Step 2: Testing direct database insert...');
        
        // Generate proper UUID format for participant_id
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        
        const testParticipantId = generateUUID();
        const testSessionId = generateUUID();

        // First, create the participant record (required by foreign key constraint)
        console.log('Creating participant record first...');
        const { data: participantData, error: participantError } = await supabase
            .from('participants')
            .insert({
                participant_id: testParticipantId
            })
            .select();

        if (participantError) {
            console.log('❌ Participant creation error:', participantError.message);
            return;
        }

        console.log('✅ Participant created successfully');

        const { data: insertData, error: insertError } = await supabase
            .from('search_result_log')
            .insert({
                participant_id: testParticipantId,
                session_id: testSessionId,
                q11_answer: "iPhone 15 Pro Max",
                q12_answer: "1TB",
                q13_answer: "Natural Titanium", 
                q14_answer: "€1,449",
                q15_answer: "https://store.apple.com/de/buy-iphone/iphone-15-pro"
            })
            .select();

        if (insertError) {
            console.log('❌ Direct insert error:', insertError.message);
            console.log('Error details:', insertError);
            return;
        }

        console.log('✅ Direct insert successful:');
        console.log(JSON.stringify(insertData, null, 2));

        // Test 3: Verify the data
        console.log('\n📥 Step 3: Verifying stored data...');
        
        const { data: selectData, error: selectError } = await supabase
            .from('search_result_log')
            .select('*')
            .eq('participant_id', testParticipantId)
            .single();

        if (selectError) {
            console.log('❌ Select error:', selectError.message);
            return;
        }

        console.log('✅ Data verification successful:');
        console.log('Participant ID:', selectData.participant_id);
        console.log('Q11 (Smartphone):', selectData.q11_answer);
        console.log('Q12 (Storage):', selectData.q12_answer);
        console.log('Q13 (Color):', selectData.q13_answer);
        console.log('Q14 (Price):', selectData.q14_answer);
        console.log('Q15 (Website):', selectData.q15_answer);

        // Test 4: Check recent records
        console.log('\n📊 Step 4: Checking recent records in table...');
        
        const { data: recentData, error: recentError } = await supabase
            .from('search_result_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            console.log('❌ Recent records error:', recentError.message);
            return;
        }

        console.log(`✅ Found ${recentData.length} recent records:`);
        recentData.forEach((record, index) => {
            console.log(`Record ${index + 1}:`, {
                participant_id: record.participant_id,
                smartphone: record.q11_answer,
                storage: record.q12_answer,
                created_at: record.created_at
            });
        });

        console.log('\n🎉 SUCCESS: Direct database access works correctly!');
        console.log('✅ search_result_log table exists and accepts data');
        console.log('✅ Questions 11-15 can be stored and retrieved');
        console.log('✅ Database schema is correct');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testDirectDatabaseAccess().then(() => {
    console.log('\nDirect database test completed.');
}).catch(console.error);
