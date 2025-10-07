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
    const { participant_id, session_id, q11_answer, q12_answer, q13_answer, q14_answer, q15_answer, q16_answer, q17_answer, q18_answer } = body;

    if (!participant_id || !session_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ip_address, device_type } = getClientInfo(req);

    console.log(`Saving search result log for participant: ${participant_id}, session: ${session_id}`);

    // Insert into search_result_log using new column names
    const { error: insertError } = await supabase
      .from('search_result_log')
      .insert([{
        participant_id,
        session_id,
        q12_smartphone_model: q11_answer || null, // q11 maps to q12_smartphone_model
        q13_storage_capacity: q12_answer || null, // q12 maps to q13_storage_capacity
        q14_color: q13_answer || null, // q13 maps to q14_color
        q15_lowest_price: q14_answer || null, // q14 maps to q15_lowest_price
        q16_website_link: q15_answer || null, // q15 maps to q16_website_link
        q17_price_importance: q17_answer || null,
        q18_smartphone_features: q18_answer || null,
        ip_address,
        device_type
      }]);

    if (insertError) {
      console.error('Search result log insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
            error: 'Failed to save search result log',
            details: insertError.message || String(insertError)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Search result log saved successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Result log endpoint error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});