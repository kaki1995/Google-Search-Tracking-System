#!/usr/bin/env powershell

# Mark migrations as applied in remote database
Write-Host "Marking migrations as applied in remote database..."

$migrations = @(
    "20250807004258",
    "20250807120000", 
    "20250807120100",
    "20250807130000",
    "20250807140000",
    "20250807150000",
    "20250808150000",
    "20250808160000", 
    "20250808161000",
    "20250808181859",
    "20250808183813",
    "20250808183832",
    "20250808183854",
    "20250809184400",
    "20250809193504",
    "20250809194102",
    "20250809195807",
    "20250809201006",
    "20250809201151",
    "20250809203001",
    "20250809203403",
    "20250809204524",
    "20250809204805",
    "20250809230000"
)

foreach ($migration in $migrations) {
    Write-Host "Marking migration $migration as applied..."
    supabase migration repair --status applied $migration
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to mark migration $migration as applied"
        exit 1
    }
}

Write-Host "All migrations marked as applied successfully!"
Write-Host "Generating updated TypeScript types..."

supabase gen types --lang=typescript --local > src/types/supabase.ts
if ($LASTEXITCODE -eq 0) {
    Write-Host "TypeScript types generated successfully!"
} else {
    Write-Error "Failed to generate TypeScript types"
    exit 1
}

Write-Host "Migration synchronization complete!"
