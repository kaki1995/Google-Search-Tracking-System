import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getClientInfo } from '../_shared/context.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { participant_id, page_id, answers } = body;

    if (!participant_id || !page_id || !answers) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id, page_id, and answers are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Saving survey page: ${page_id} for participant: ${participant_id}`);

    // For now, we'll use localStorage pattern server-side storage
    // In a full implementation, you might want a dedicated survey_page_answers table
    // For this implementation, we'll save to the appropriate survey table based on page_id

    if (page_id === 'background_survey') {
      // Save to background_survey or update existing
      const { error: saveError } = await supabase
        .from('background_surveys')
        .upsert({
          participant_id,
          responses: answers,
          ...getClientInfo(req)
        }, {
          onConflict: 'participant_id'
        });

      if (saveError) {
        console.error('Background survey save error:', saveError);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to save background survey' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (page_id === 'post_task_survey') {
      // Save to post_task_survey or update existing
      const { error: saveError } = await supabase
        .from('post_task_survey')
        .upsert({
          participant_id,
          responses: answers,
          ...getClientInfo(req)
        }, {
          onConflict: 'participant_id'
        });

      if (saveError) {
        console.error('Post task survey save error:', saveError);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to save post task survey' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (page_id === 'search_result_log') {
      // Save to search_result_log or update existing
      const { error: saveError } = await supabase
        .from('search_result_log')
        .upsert({
          participant_id,
          ...answers, // Spread the q11-q15 answers
          ...getClientInfo(req)
        }, {
          onConflict: 'participant_id'
        });

      if (saveError) {
        console.error('Search result log save error:', saveError);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to save search result log' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (page_id === 'task_instruction') {
      // Save to task_instruction or update existing
      const { error: saveError } = await supabase
        .from('task_instruction')
        .upsert({
          participant_id,
          q10_response: answers.budget_range || answers.q10_response,
          ...getClientInfo(req)
        }, {
          onConflict: 'participant_id'
        });

      if (saveError) {
        console.error('Task instruction save error:', saveError);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to save task instruction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Survey answers saved successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Survey save endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});