// Enhanced Tracking Database Migration Verification
// This script tests if enhanced tracking methods work with Supabase remote database

import { supabase } from './src/integrations/supabase/client.js';
import { trackingService } from './src/lib/tracking.js';

console.log('🚀 Starting Enhanced Tracking Database Verification...');

// Test configuration
const TEST_USER_ID = 'migration-test-user-' + Date.now();
let testSessionId = null;
let testQueryId = null;

async function verifyDatabaseTables() {
    console.log('\n📊 Step 1: Verifying Enhanced Database Tables...');
    
    const enhancedTables = [
        'query_timing_metrics',
        'interaction_details', 
        'survey_exits'
    ];
    
    const coreTables = [
        'sessions',
        'experiment_queries',
        'interactions',
        'background_surveys',
        'post_survey'
    ];
    
    console.log('Checking enhanced tables:');
    for (const table of enhancedTables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: Accessible`);
            }
        } catch (e) {
            console.log(`❌ ${table}: ${e.message}`);
        }
    }
    
    console.log('\nChecking core tables:');
    for (const table of coreTables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: Accessible`);
            }
        } catch (e) {
            console.log(`❌ ${table}: ${e.message}`);
        }
    }
}

async function testEnhancedQueryTracking() {
    console.log('\n⏱️ Step 2: Testing Enhanced Query Tracking...');
    
    try {
        // Initialize session
        testSessionId = await trackingService.initSession(TEST_USER_ID);
        console.log(`✅ Session initialized: ${testSessionId}`);
        
        // Track query (should create enhanced timing metrics)
        testQueryId = await trackingService.trackQuery('enhanced migration test query', 10);
        console.log(`✅ Query tracked with ID: ${testQueryId}`);
        
        // Test direct timing metrics insertion
        await trackingService.trackQueryTimingMetrics(testQueryId, {
            search_duration_ms: 1500,
            time_to_first_result: 800,
            results_loaded_count: 10,
            user_clicked: false,
            user_scrolled: false,
            query_abandoned: false
        });
        console.log('✅ Direct timing metrics inserted');
        
        // Verify timing metrics in database
        const { data: timingData, error: timingError } = await supabase
            .from('query_timing_metrics')
            .select('*')
            .eq('query_id', testQueryId)
            .single();
            
        if (timingError) {
            console.log(`❌ Timing metrics verification failed: ${timingError.message}`);
        } else {
            console.log('✅ Timing metrics verified in database:', timingData);
        }
        
    } catch (error) {
        console.log(`❌ Enhanced query tracking failed: ${error.message}`);
    }
}

async function testEnhancedInteractionTracking() {
    console.log('\n🖱️ Step 3: Testing Enhanced Interaction Tracking...');
    
    try {
        if (!testQueryId) {
            console.log('❌ No query ID available for interaction test');
            return;
        }
        
        // Test enhanced click tracking
        await trackingService.trackClickWithDetails(
            'https://enhanced-migration-test.com',
            'Enhanced Migration Test Result',
            1,
            testQueryId,
            {
                element_text: 'Test enhanced click tracking',
                page_coordinates: { x: 200, y: 100 },
                viewport_coordinates: { x: 200, y: 100 },
                scroll_depth: 500,
                hover_duration_ms: 1200
            }
        );
        console.log('✅ Enhanced click tracking completed');
        
        // Verify interaction details in database
        const { data: interactionData, error: interactionError } = await supabase
            .from('interactions')
            .select(`
                id,
                clicked_url,
                clicked_rank,
                interaction_details (
                    id,
                    interaction_type,
                    element_id,
                    value,
                    metadata
                )
            `)
            .eq('query_id', testQueryId)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (interactionError) {
            console.log(`❌ Interaction details verification failed: ${interactionError.message}`);
        } else if (interactionData && interactionData.length > 0) {
            console.log('✅ Interaction details verified in database:', interactionData[0]);
        } else {
            console.log('⚠️ No interaction details found in database');
        }
        
    } catch (error) {
        console.log(`❌ Enhanced interaction tracking failed: ${error.message}`);
    }
}

async function testSurveyExitTracking() {
    console.log('\n🚪 Step 4: Testing Survey Exit Tracking...');
    
    try {
        if (!testSessionId) {
            console.log('❌ No session ID available for exit test');
            return;
        }
        
        // Test survey exit tracking
        await trackingService.trackExitStudy('enhanced_migration_test');
        console.log('✅ Survey exit tracking completed');
        
        // Verify survey exit in database
        const { data: exitData, error: exitError } = await supabase
            .from('survey_exits')
            .select('*')
            .eq('session_id', testSessionId)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (exitError) {
            console.log(`❌ Survey exit verification failed: ${exitError.message}`);
        } else if (exitData && exitData.length > 0) {
            console.log('✅ Survey exit verified in database:', exitData[0]);
        } else {
            console.log('⚠️ No survey exit found in database');
        }
        
    } catch (error) {
        console.log(`❌ Survey exit tracking failed: ${error.message}`);
    }
}

async function testQueryAbandonment() {
    console.log('\n🚫 Step 5: Testing Query Abandonment...');
    
    try {
        if (!testQueryId) {
            console.log('❌ No query ID available for abandonment test');
            return;
        }
        
        // Test query abandonment
        await trackingService.trackQueryAbandonment(testQueryId, 'migration_test_abandonment');
        console.log('✅ Query abandonment tracking completed');
        
        // Verify timing metrics update
        const { data: updatedTiming, error: updateError } = await supabase
            .from('query_timing_metrics')
            .select('*')
            .eq('query_id', testQueryId)
            .single();
            
        if (updateError) {
            console.log(`❌ Query abandonment verification failed: ${updateError.message}`);
        } else {
            console.log('✅ Query abandonment verified:', {
                query_abandoned: updatedTiming.query_abandoned,
                query_end_time: updatedTiming.query_end_time
            });
        }
        
    } catch (error) {
        console.log(`❌ Query abandonment tracking failed: ${error.message}`);
    }
}

async function generateMigrationReport() {
    console.log('\n📋 Step 6: Generating Migration Report...');
    
    try {
        // Count records in enhanced tables
        const tables = ['query_timing_metrics', 'interaction_details', 'survey_exits'];
        const report = {};
        
        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                report[table] = `Error: ${error.message}`;
            } else {
                report[table] = `${count} records`;
            }
        }
        
        console.log('📊 Enhanced Tables Status:');
        Object.entries(report).forEach(([table, status]) => {
            console.log(`   ${table}: ${status}`);
        });
        
        // Check for recent test data
        const { data: recentSessions, error: sessionError } = await supabase
            .from('sessions')
            .select('id, user_id, created_at')
            .like('user_id', 'migration-test-user-%')
            .order('created_at', { ascending: false })
            .limit(3);
            
        if (!sessionError && recentSessions && recentSessions.length > 0) {
            console.log('\n🧪 Recent Test Sessions:');
            recentSessions.forEach(session => {
                console.log(`   ${session.id} (${session.user_id}) - ${session.created_at}`);
            });
        }
        
    } catch (error) {
        console.log(`❌ Migration report generation failed: ${error.message}`);
    }
}

// Main execution
async function runEnhancedMigrationVerification() {
    try {
        console.log('🔄 Enhanced Tracking Database Migration Verification');
        console.log('=' * 60);
        
        await verifyDatabaseTables();
        await testEnhancedQueryTracking();
        await testEnhancedInteractionTracking();
        await testSurveyExitTracking();
        await testQueryAbandonment();
        await generateMigrationReport();
        
        console.log('\n🎉 Enhanced Tracking Migration Verification Complete!');
        console.log('=' * 60);
        
    } catch (error) {
        console.log(`❌ Migration verification failed: ${error.message}`);
    }
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
    // Browser environment
    window.runEnhancedMigrationVerification = runEnhancedMigrationVerification;
    console.log('🌐 Enhanced migration verification loaded. Run: runEnhancedMigrationVerification()');
} else {
    // Node.js environment
    runEnhancedMigrationVerification();
}
