# Supabase migration and type generation automation script
# Usage: Replace <your-project-ref> with your Supabase project ref
# Save as supabase-migrate.ps1 and run in PowerShell from your project root

$projectRef = "wbguuipoggeamyzrfvbv"

Write-Host "Logging in to Supabase..."
supabase login

Write-Host "Linking local project to remote Supabase..."
supabase link --project-ref $projectRef

Write-Host "Pushing migrations to remote Supabase..."
supabase db push

Write-Host "Generating TypeScript types for Supabase tables..."
supabase gen types typescript --project-id $projectRef --schema public > src/integrations/supabase/types.ts

Write-Host "Migration and type generation complete!"
