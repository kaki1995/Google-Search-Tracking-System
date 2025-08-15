import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const participant_id = url.searchParams.get('participant_id');
    const page_id = url.searchParams.get('page_id');

    if (!participant_id || !page_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id and page_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Loading survey page: ${page_id} for participant: ${participant_id}`);

    let answers = null;

    if (page_id === 'background_survey') {
      const { data, error } = await supabase
        .from('background_surveys')
        .select('responses')
        .eq('participant_id', participant_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Background survey load error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to load background survey' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      answers = data?.responses || null;
    } else if (page_id === 'post_task_survey') {
      const { data, error } = await supabase
        .from('post_task_survey')
        .select('responses')
        .eq('participant_id', participant_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Post task survey load error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to load post task survey' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      answers = data?.responses || null;
    } else if (page_id === 'search_result_log') {
      const { data, error } = await supabase
        .from('search_result_log')
        .select('smartphone_model, storage_capacity, color, lowest_price, website_link')
        .eq('participant_id', participant_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Search result log load error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to load search result log' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert database fields back to form field names
      if (data) {
        answers = {
          smartphone_model: data.smartphone_model,
          storage_capacity: data.storage_capacity,
          color: data.color,
          lowest_price: data.lowest_price,
          website_link: data.website_link
        };
      }
    } else if (page_id === 'task_instruction') {
      const { data, error } = await supabase
        .from('task_instruction')
        .select('q10_response')
        .eq('participant_id', participant_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Task instruction load error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to load task instruction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert database field back to form field name
      if (data) {
        answers = {
          budget_range: data.q10_response
        };
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        answers
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Survey load endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});