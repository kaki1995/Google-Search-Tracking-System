import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoadResponseRequest {
  participant_id: string;
  page_id: string;
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

    const { participant_id, page_id }: LoadResponseRequest = await req.json()

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

    // Validate page_id
    const validPages = ['background_survey', 'task_instruction', 'search_result_log', 'post_task_survey'];
    if (!validPages.includes(page_id)) {
      return new Response(
        JSON.stringify({ ok: false, error: `Invalid page_id. Must be one of: ${validPages.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Load the saved response data
    const { data: responseData, error: loadError } = await supabaseClient
      .from('saved_responses')
      .select('*')
      .eq('participant_id', participant_id)
      .eq('page_id', page_id)
      .single();

    if (loadError) {
      if (loadError.code === 'PGRST116') {
        // No data found - this is normal for new participants
        console.log(`No saved response found for ${participant_id}/${page_id}`);
        return new Response(
          JSON.stringify({ 
            ok: true, 
            message: 'No saved response found',
            data: null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.error('Error loading response:', loadError);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to load response', details: loadError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // Log navigation back event for analytics
    const { error: historyError } = await supabaseClient
      .from('response_history')
      .insert({
        participant_id,
        session_id: responseData.session_id,
        page_id,
        response_data: responseData.response_data,
        change_type: 'navigate_back'
      });

    if (historyError) {
      console.warn('Warning: Failed to log navigation back event:', historyError);
    }

    console.log(`📋 Response loaded successfully for ${participant_id}/${page_id}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: 'Response loaded successfully',
        data: {
          response_data: responseData.response_data,
          updated_at: responseData.updated_at,
          created_at: responseData.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in load-responses:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error', details: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
