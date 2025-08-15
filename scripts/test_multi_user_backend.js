// Multi-User Backend Session Test
// This script tests that the backend properly creates unique sessions for multiple users

const SUPABASE_URL = 'https://mmccbfzxoktcjvfhmhms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tY2NiZnp4b2t0Y2p2ZmhtaG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDk0MzQsImV4cCI6MjA1MTUyNTQzNH0.XC8qr_kHHoZvHnp4Dka5u9WlLEOvJjOKy_VPwKpZw9Q';

async function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function createUserSession(userNumber) {
    console.log(`\n🚀 Creating session for User ${userNumber}...`);
    
    try {
        // Generate unique participant ID (like sessionManager would do)
        const participantId = await generateUUID();
        console.log(`Generated participant ID: ${participantId}`);
        
        // Call consent-confirm function to create session
        const response = await fetch(`${SUPABASE_URL}/functions/v1/consent-confirm`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participant_id: participantId,
                consent_timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ User ${userNumber} session created successfully!`);
        console.log(`Participant ID: ${result.participant_id}`);
        console.log(`Session ID: ${result.session_id}`);
        
        return {
            userNumber,
            participantId: result.participant_id,
            sessionId: result.session_id,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`❌ User ${userNumber} session creation failed:`, error.message);
        return {
            userNumber,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

async function testMultipleUsers() {
    console.log('🧪 Starting Multi-User Backend Session Test\n');
    console.log('Testing that multiple users get unique participant IDs and session IDs...\n');
    
    const results = [];
    
    // Create sessions for 3 different users
    for (let i = 1; i <= 3; i++) {
        const result = await createUserSession(i);
        results.push(result);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
        console.log(`❌ ${errors.length} session(s) failed to create:`);
        errors.forEach(e => {
            console.log(`   User ${e.userNumber}: ${e.error}`);
        });
    }
    
    // Check successful sessions
    const successful = results.filter(r => !r.error);
    console.log(`✅ ${successful.length} session(s) created successfully`);
    
    if (successful.length > 0) {
        // Check for unique participant IDs
        const participantIds = successful.map(s => s.participantId);
        const uniqueParticipantIds = [...new Set(participantIds)];
        
        // Check for unique session IDs
        const sessionIds = successful.map(s => s.sessionId);
        const uniqueSessionIds = [...new Set(sessionIds)];
        
        console.log(`\n🔍 Uniqueness Check:`);
        console.log(`Participant IDs: ${participantIds.length} total, ${uniqueParticipantIds.length} unique`);
        console.log(`Session IDs: ${sessionIds.length} total, ${uniqueSessionIds.length} unique`);
        
        if (uniqueParticipantIds.length === participantIds.length && 
            uniqueSessionIds.length === sessionIds.length) {
            console.log(`\n🎉 SUCCESS: All IDs are unique! Multi-user support working correctly.`);
        } else {
            console.log(`\n⚠️  WARNING: Duplicate IDs found! Multi-user support needs attention.`);
        }
        
        console.log(`\n📋 Detailed Results:`);
        successful.forEach(s => {
            console.log(`User ${s.userNumber}:`);
            console.log(`  Participant ID: ${s.participantId}`);
            console.log(`  Session ID: ${s.sessionId}`);
            console.log(`  Created: ${new Date(s.timestamp).toLocaleString()}`);
        });
    }
    
    console.log('\n🏁 Test Complete!');
}

// Run the test
if (typeof window === 'undefined') {
    // Node.js environment
    import('node-fetch').then(({ default: fetch }) => {
        global.fetch = fetch;
        global.crypto = require('crypto');
        testMultipleUsers().catch(console.error);
    }).catch(console.error);
} else {
    // Browser environment
    testMultipleUsers().catch(console.error);
}
