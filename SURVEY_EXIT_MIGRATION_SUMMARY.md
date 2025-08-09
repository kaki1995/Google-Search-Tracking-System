# Survey Exit Tracking - Migration Sync Summary

## 🎯 Objective Achieved
✅ **Survey exit tracking successfully implemented** - Users can now be tracked when they click "Exit Study" button

## 📊 Implementation Status

### Frontend Implementation ✅ COMPLETE
- **File**: `src/pages/Welcome.tsx`
- **Feature**: Exit Study button with tracking
- **Code**: `handleExit` function calls `trackingService.trackExitStudy('user_clicked_exit_study')`

### Backend Service ✅ COMPLETE
- **File**: `src/lib/tracking.ts`
- **Method**: `trackExitStudy(reason?: string)`
- **Features**:
  - Logs event locally in session data
  - Attempts to insert into `survey_exits` table
  - Falls back to `sessions` table update if table doesn't exist
  - Captures exit reason, timestamp, page URL, and user agent

### Database Schema ⚠️ REQUIRES MANUAL SETUP
- **Status**: SQL ready, needs manual execution
- **File**: `complete_migration.sql`
- **Table**: `survey_exits` with comprehensive tracking fields

## 🚧 Current Migration Challenges

### Issue Encountered
- Migration history conflicts between local and remote Supabase database
- Some tables already exist in remote, causing `CREATE TABLE` conflicts
- Authentication timeouts during migration repair process

### Solution Approach
1. **Manual Database Setup**: Run SQL directly in Supabase dashboard
2. **Type Generation**: Update TypeScript types after table creation
3. **Migration Marking**: Mark migration as applied for history consistency

## 📝 Manual Steps Required

### Step 1: Create Database Table
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/wbguuipoggeamyzrfvbv/editor)
2. Copy and execute content from `complete_migration.sql`
3. Verify table creation with provided verification queries

### Step 2: Update TypeScript Types
```powershell
supabase gen types --lang=typescript --linked > src/types/supabase.ts
```

### Step 3: Mark Migration as Applied (Optional)
```powershell
supabase migration repair --status applied 20250809230000
```

## 🎯 Survey Exit Tracking Schema

### survey_exits Table
```sql
CREATE TABLE public.survey_exits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    survey_type TEXT CHECK (survey_type IN ('background', 'post_task', 'general')),
    exit_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    exit_reason TEXT, -- 'user_clicked_exit_study', 'browser_close', etc.
    time_spent_ms INTEGER,
    questions_answered INTEGER DEFAULT 0,
    form_data JSONB,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Additional Session Columns
- `background_survey_status` / `post_survey_status`
- `background_survey_exit_time` / `post_survey_exit_time`
- `background_survey_exit_reason` / `post_survey_exit_reason`

## 🔄 How It Works

### User Flow
1. User visits Welcome page
2. User clicks "Exit Study" button
3. Frontend calls `trackingService.trackExitStudy('user_clicked_exit_study')`
4. Backend attempts to insert record into `survey_exits` table
5. If table exists: Records detailed exit event
6. If table missing: Falls back to updating `sessions` table
7. Event logged locally in session data for immediate access

### Data Captured
- **Session ID**: Links exit to user session
- **Exit Reason**: Why user exited ('user_clicked_exit_study')
- **Timestamp**: When exit occurred
- **Page URL**: Where user was when they exited
- **User Agent**: Browser/device information
- **Survey Type**: Which part of study they exited from

## 🧪 Testing

### Test Survey Exit Tracking
1. Start development server: `npm run dev`
2. Navigate to welcome page
3. Click "Exit Study" button
4. Check browser console for "Exit study event tracked successfully"
5. Verify record in Supabase dashboard (survey_exits or sessions table)

### Verification Queries
```sql
-- Check recent exit events
SELECT * FROM survey_exits ORDER BY exit_time DESC LIMIT 10;

-- Check session exit tracking
SELECT id, user_id, background_survey_status, updated_at 
FROM sessions WHERE updated_at > NOW() - INTERVAL '1 hour';
```

## 📁 Modified Files

### Frontend
- `src/pages/Welcome.tsx` - Added exit tracking to handleExit function

### Backend
- `src/lib/tracking.ts` - Enhanced trackExitStudy method with survey_exits table support

### Database
- `supabase/migrations/20250809230000_add_survey_exit_tracking.sql` - Survey exit migration
- `complete_migration.sql` - Manual setup SQL
- `apply_survey_exits.sql` - Safe table creation SQL

### Automation
- `supabase-migrate.ps1` - Migration automation script
- `complete-migration-sync.ps1` - Final setup completion script
- `mark-migrations-applied.ps1` - Migration history repair script

## ✨ Success Metrics

### Current Status
- ✅ Frontend button tracking implemented
- ✅ Backend service with fallback logic
- ✅ Comprehensive database schema designed
- ⚠️ Database table creation pending manual setup
- ⚠️ TypeScript types update pending

### Expected Outcome
Once manual setup is complete:
1. **Robust Exit Tracking**: Detailed capture of survey exit events
2. **Data Integrity**: Proper foreign key relationships with sessions
3. **Research Value**: Rich data for understanding user study behavior
4. **Fallback Safety**: Works even if table creation fails

## 🔗 Related Documentation
- `SUPABASE_MIGRATION_SUMMARY.md` - Previous migration attempts
- `DATABASE_CONNECTION_SUMMARY.md` - Database setup context
- `MIGRATION_GUIDE.md` - General migration guidance

---

**Next Action**: Execute `complete_migration.sql` in Supabase dashboard to finalize survey exit tracking implementation.
