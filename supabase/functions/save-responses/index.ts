import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaveResponseRequest {
  participant_id: string;
  page_id: string;
  response_data: Record<string, any>;
  session_id?: string;
  change_type?: 'create' | 'update' | 'navigate_away' | 'navigate_back';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { participant_id, page_id, response_data, session_id, change_type = 'update' }: SaveResponseRequest = await req.json()

    // Validation
    if (!participant_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!page_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'page_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!response_data || typeof response_data !== 'object') {
      return new Response(
        JSON.stringify({ ok: false, error: 'response_data must be a valid object' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate page_id
    const validPages = ['background_survey', 'task_instruction', 'search_result_log', 'post_task_survey'];
    if (!validPages.includes(page_id)) {
      return new Response(
        JSON.stringify({ ok: false, error: `Invalid page_id. Must be one of: ${validPages.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get session_id if not provided
    let currentSessionId = session_id;
    if (!currentSessionId) {
      const { data: sessionData, error: sessionError } = await supabaseClient
        .from('sessions')
        .select('id')
        .eq('participant_id', participant_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !sessionData) {
        console.log('No session found for participant:', participant_id);
        currentSessionId = null; // Allow saving without session for robustness
      } else {
        currentSessionId = sessionData.id;
      }
    }

    // Save or update the response data
    const { data: saveData, error: saveError } = await supabaseClient
      .from('saved_responses')
      .upsert({
        participant_id,
        session_id: currentSessionId,
        page_id,
        response_data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'participant_id,page_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving response:', saveError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to save response', details: saveError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Log to response history for analytics
    const { error: historyError } = await supabaseClient
      .from('response_history')
      .insert({
        participant_id,
        session_id: currentSessionId,
        page_id,
        response_data,
        change_type
      });

    if (historyError) {
      console.warn('Warning: Failed to log response history:', historyError);
      // Don't fail the main operation if history logging fails
    }

    // Update session statistics if session exists
    if (currentSessionId) {
      const { error: sessionUpdateError } = await supabaseClient
        .from('sessions')
        .update({
          last_response_save_time: new Date().toISOString(),
          total_response_changes: supabaseClient.rpc('increment_response_changes', { session_id: currentSessionId }),
          pages_with_saved_responses: supabaseClient.rpc('add_page_to_saved_list', { 
            session_id: currentSessionId, 
            page_name: page_id 
          })
        })
        .eq('id', currentSessionId);

      if (sessionUpdateError) {
        console.warn('Warning: Failed to update session statistics:', sessionUpdateError);
      }
    }

    console.log(`✅ Response saved successfully for ${participant_id}/${page_id}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: 'Response saved successfully',
        data: {
          id: saveData.id,
          participant_id,
          page_id,
          session_id: currentSessionId,
          updated_at: saveData.updated_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in save-responses:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
