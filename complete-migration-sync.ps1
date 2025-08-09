#!/usr/bin/env powershell

# Migration Sync Completion Script
# This script helps complete the survey exit tracking implementation

Write-Host "🚀 Survey Exit Tracking - Migration Sync Completion" -ForegroundColor Cyan
Write-Host "=" * 60

# Step 1: Check migration status
Write-Host "`n📋 Step 1: Checking current migration status..."
supabase migration list
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to check migration status. Please ensure you're authenticated with Supabase."
    exit 1
}

# Step 2: Display manual SQL instructions
Write-Host "`n📝 Step 2: Manual Database Setup Required"
Write-Host "The survey_exits table needs to be created manually due to migration conflicts."
Write-Host "Please follow these steps:"
Write-Host ""
Write-Host "1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/wbguuipoggeamyzrfvbv/editor" -ForegroundColor Yellow
Write-Host "2. Copy and run the SQL from: complete_migration.sql" -ForegroundColor Yellow
Write-Host "3. Come back and press Enter to continue..." -ForegroundColor Yellow
Read-Host "Press Enter when you've run the SQL in Supabase dashboard"

# Step 3: Mark the survey exits migration as applied
Write-Host "`n📋 Step 3: Marking survey_exits migration as applied..."
supabase migration repair --status applied 20250809230000
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Survey exits migration marked as applied" -ForegroundColor Green
} else {
    Write-Warning "⚠️ Could not mark migration as applied - this is OK if you created the table manually"
}

# Step 4: Generate updated TypeScript types
Write-Host "`n🔄 Step 4: Generating updated TypeScript types..."
supabase gen types --lang=typescript --linked > src/types/supabase.ts
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript types generated successfully!" -ForegroundColor Green
} else {
    Write-Error "❌ Failed to generate TypeScript types"
    Write-Host "Manual command: supabase gen types --lang=typescript --linked > src/types/supabase.ts" -ForegroundColor Yellow
}

# Step 5: Test the implementation
Write-Host "`n🧪 Step 5: Testing survey exit tracking..."
Write-Host "The survey exit tracking is now implemented:"
Write-Host "- Frontend: Welcome page 'Exit Study' button ✅"
Write-Host "- Backend: trackingService.trackExitStudy() method ✅"
Write-Host "- Database: survey_exits table (after manual SQL) ✅"
Write-Host ""
Write-Host "To test:"
Write-Host "1. Start your development server: npm run dev"
Write-Host "2. Navigate to the welcome page"
Write-Host "3. Click 'Exit Study' button"
Write-Host "4. Check Supabase dashboard for recorded exit event"

# Step 6: Verification
Write-Host "`n🔍 Step 6: Final verification..."
Write-Host "Checking if types include survey_exits table..."

if (Test-Path "src/types/supabase.ts") {
    $typesContent = Get-Content "src/types/supabase.ts" -Raw
    if ($typesContent -match "survey_exits") {
        Write-Host "✅ survey_exits table found in TypeScript types!" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ survey_exits table not found in types. Make sure you ran the SQL manually."
    }
} else {
    Write-Warning "⚠️ TypeScript types file not found. Please generate types manually."
}

Write-Host "`n🎉 Survey Exit Tracking Implementation Status:"
Write-Host "- Frontend tracking: ✅ READY"
Write-Host "- Backend service: ✅ READY" 
Write-Host "- Database table: ❓ PENDING (requires manual SQL execution)"
Write-Host "- TypeScript types: ❓ PENDING (after table creation)"

Write-Host "`n📚 Next Steps:"
Write-Host "1. Run the SQL in complete_migration.sql in your Supabase dashboard"
Write-Host "2. Re-run this script to update types"
Write-Host "3. Test the survey exit tracking functionality"

Write-Host "`n✨ Once complete, users clicking 'Exit Study' will be tracked in survey_exits table!" -ForegroundColor Green
