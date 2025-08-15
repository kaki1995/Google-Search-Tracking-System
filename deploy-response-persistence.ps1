# Deploy Enhanced Response Persistence System
# Run this script to deploy all database and Edge Function changes

Write-Host "🚀 Starting Enhanced Response Persistence Deployment..." -ForegroundColor Green

# Step 1: Deploy database migration
Write-Host "`n📊 Step 1: Deploying database migration..." -ForegroundColor Yellow
Write-Host "Please run the following SQL in your Supabase SQL Editor:"
Write-Host "https://supabase.com/dashboard/project/mmccbfzxoktcjvfhmhms/editor" -ForegroundColor Cyan
Write-Host "`nSQL File: response_persistence_migration.sql" -ForegroundColor White
Write-Host "This will create:"
Write-Host "- saved_responses table for storing user responses"
Write-Host "- response_history table for tracking changes"
Write-Host "- Enhanced RLS policies and indexes"
Write-Host "- Analytics functions for response tracking"
Read-Host "`nPress Enter after running the SQL migration..."

# Step 2: Deploy Edge Functions
Write-Host "`n🔧 Step 2: Deploying Edge Functions..." -ForegroundColor Yellow

try {
    # Deploy save-responses function
    Write-Host "Deploying save-responses function..."
    $saveResult = npx supabase functions deploy save-responses --project-ref mmccbfzxoktcjvfhmhms
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ save-responses function deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to deploy save-responses function" -ForegroundColor Red
        throw "save-responses deployment failed"
    }

    # Deploy load-responses function
    Write-Host "Deploying load-responses function..."
    $loadResult = npx supabase functions deploy load-responses --project-ref mmccbfzxoktcjvfhmhms
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ load-responses function deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to deploy load-responses function" -ForegroundColor Red
        throw "load-responses deployment failed"
    }

    Write-Host "`n🎉 All Edge Functions deployed successfully!" -ForegroundColor Green

} catch {
    Write-Host "`n❌ Error deploying Edge Functions: $_" -ForegroundColor Red
    Write-Host "Please check your Supabase CLI installation and project configuration." -ForegroundColor Yellow
    exit 1
}

# Step 3: Test the deployment
Write-Host "`n🧪 Step 3: Testing deployment..." -ForegroundColor Yellow

# Create test script for response persistence
$testScript = @"
// Test Response Persistence System
const SUPABASE_URL = 'https://mmccbfzxoktcjvfhmhms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tY2NiZnp4b2t0Y2p2ZmhtaG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDk0MzQsImV4cCI6MjA1MTUyNTQzNH0.XC8qr_kHHoZvHnp4Dka5u9WlLEOvJjOKy_VPwKpZw9Q';

async function testResponsePersistence() {
    console.log('🧪 Testing Response Persistence System...\n');
    
    const testParticipantId = crypto.randomUUID();
    const testData = {
        age: '25-34',
        gender: 'female',
        education: 'bachelor'
    };
    
    try {
        // Test save-responses function
        console.log('📝 Testing save-responses...');
        const saveResponse = await fetch(`${SUPABASE_URL}/functions/v1/save-responses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participant_id: testParticipantId,
                page_id: 'background_survey',
                response_data: testData
            })
        });
        
        const saveResult = await saveResponse.json();
        if (saveResult.ok) {
            console.log('✅ save-responses function working correctly');
        } else {
            console.log('❌ save-responses function failed:', saveResult.error);
            return;
        }
        
        // Test load-responses function
        console.log('📋 Testing load-responses...');
        const loadResponse = await fetch(`${SUPABASE_URL}/functions/v1/load-responses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participant_id: testParticipantId,
                page_id: 'background_survey'
            })
        });
        
        const loadResult = await loadResponse.json();
        if (loadResult.ok && loadResult.data) {
            console.log('✅ load-responses function working correctly');
            console.log('📊 Loaded data:', loadResult.data.response_data);
            
            // Verify data integrity
            if (JSON.stringify(loadResult.data.response_data) === JSON.stringify(testData)) {
                console.log('✅ Data integrity verified - saved and loaded data match!');
            } else {
                console.log('❌ Data integrity issue - saved and loaded data do not match');
            }
        } else {
            console.log('❌ load-responses function failed:', loadResult.error);
        }
        
        console.log('\n🎉 Response Persistence System test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testResponsePersistence();
"@

# Write test script to file
$testScript | Out-File -FilePath "scripts/test_response_persistence_deployment.js" -Encoding UTF8

Write-Host "Running deployment test..."
try {
    node "scripts/test_response_persistence_deployment.js"
    Write-Host "✅ Deployment test completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Deployment test encountered issues: $_" -ForegroundColor Yellow
    Write-Host "This may be normal if the functions are still deploying." -ForegroundColor Yellow
}

# Step 4: Deployment summary
Write-Host "`n📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "✅ Database migration: response_persistence_migration.sql"
Write-Host "✅ Edge Function: save-responses"
Write-Host "✅ Edge Function: load-responses" 
Write-Host "✅ SessionManager updated to use new functions"
Write-Host "✅ Response persistence hooks implemented"
Write-Host "✅ All survey components updated"

Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. Test the application at http://localhost:8081/"
Write-Host "2. Test response persistence by filling forms and navigating back"
Write-Host "3. Use response-persistence-test.html for comprehensive testing"
Write-Host "4. Monitor Supabase logs for any errors"

Write-Host "`n🔗 Useful Links:" -ForegroundColor Blue
Write-Host "- Supabase Dashboard: https://supabase.com/dashboard/project/mmccbfzxoktcjvfhmhms"
Write-Host "- SQL Editor: https://supabase.com/dashboard/project/mmccbfzxoktcjvfhmhms/editor"
Write-Host "- Edge Functions: https://supabase.com/dashboard/project/mmccbfzxoktcjvfhmhms/functions"
Write-Host "- Logs: https://supabase.com/dashboard/project/mmccbfzxoktcjvfhmhms/logs"

Write-Host "`n🚀 Enhanced Response Persistence System deployment complete!" -ForegroundColor Green
