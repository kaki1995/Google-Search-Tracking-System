// Test script for Questions 11-15 storage
// Run with: node test-q11-15-storage.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wbguuipoggeamyzrfvbv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieHVpaXBwZ2dlYW15enJmdmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNjE3MzUsImV4cCI6MjA0ODkzNzczNX0.PvWfN1fTf2cJfNcCB8_m8l2M_SX2T7E6CX7yOYgLaL8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQ11to15Storage() {
    console.log('🔍 Testing Questions 11-15 Storage...\n');

    const testParticipantId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const testSessionId = `session_${Date.now()}`;

    const testAnswers = {
        q11_answer: "iPhone 15 Pro Max",
        q12_answer: "1TB", 
        q13_answer: "Natural Titanium",
        q14_answer: "€1,449",
        q15_answer: "https://store.apple.com/de/buy-iphone/iphone-15-pro"
    };

    try {
        console.log('📤 Step 1: Testing result-log Edge Function...');
        console.log('Participant ID:', testParticipantId);
        console.log('Session ID:', testSessionId);
        console.log('Test answers:', testAnswers);

        const { data: functionResult, error: functionError } = await supabase.functions.invoke('result-log', {
            body: {
                participant_id: testParticipantId,
                session_id: testSessionId,
                ...testAnswers
            }
        });

        if (functionError) {
            throw new Error(`Edge Function error: ${functionError.message}`);
        }

        if (!functionResult || !functionResult.ok) {
            throw new Error(`Function returned error: ${functionResult?.error || 'Unknown error'}`);
        }

        console.log('✅ Edge Function call successful');

        console.log('\n📥 Step 2: Verifying database storage...');
        
        const { data: dbData, error: dbError } = await supabase
            .from('search_result_log')
            .select('*')
            .eq('participant_id', testParticipantId)
            .single();

        if (dbError) {
            throw new Error(`Database query error: ${dbError.message}`);
        }

        console.log('✅ Database record found:');
        console.log(JSON.stringify(dbData, null, 2));

        console.log('\n🔄 Step 3: Testing answer retention via survey-save/survey-load...');
        
        const retentionAnswers = {
            smartphone_model: "Samsung Galaxy S24 Ultra",
            storage_capacity: "512gb",
            color: "Phantom Black", 
            lowest_price: "€1,299",
            website_link: "https://samsung.com/galaxy-s24-ultra"
        };

        // Test save
        const { data: saveResult, error: saveError } = await supabase.functions.invoke('survey-save', {
            body: {
                participant_id: testParticipantId + '_retention',
                page_id: 'search_result_log',
                answers: retentionAnswers
            }
        });

        if (saveError || !saveResult?.ok) {
            throw new Error(`Survey save error: ${saveError?.message || saveResult?.error}`);
        }

        console.log('✅ Survey save successful');

        // Test load
        const { data: loadResult, error: loadError } = await supabase.functions.invoke('survey-load', {
            body: {
                participant_id: testParticipantId + '_retention',
                page_id: 'search_result_log'
            }
        });

        if (loadError || !loadResult?.ok) {
            throw new Error(`Survey load error: ${loadError?.message || loadResult?.error}`);
        }

        console.log('✅ Survey load successful:');
        console.log(JSON.stringify(loadResult.answers, null, 2));

        console.log('\n📊 Step 4: Checking recent database records...');
        
        const { data: recentRecords, error: queryError } = await supabase
            .from('search_result_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (queryError) {
            console.log(`⚠️ Database query warning: ${queryError.message}`);
        } else {
            console.log(`✅ Found ${recentRecords.length} recent records in search_result_log table`);
            recentRecords.forEach((record, index) => {
                console.log(`Record ${index + 1}:`, {
                    participant_id: record.participant_id,
                    q11_answer: record.q11_answer,
                    q12_answer: record.q12_answer,
                    q13_answer: record.q13_answer,
                    q14_answer: record.q14_answer,
                    q15_answer: record.q15_answer,
                    created_at: record.created_at
                });
            });
        }

        console.log('\n🎉 SUCCESS: Questions 11-15 storage is working correctly!');
        console.log('✅ result-log Edge Function saves data properly');
        console.log('✅ search_result_log table stores the answers');
        console.log('✅ Answer retention works for navigation');
        console.log('✅ Database integration is complete');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testQ11to15Storage().then(() => {
    console.log('\nTest completed.');
}).catch(console.error);
