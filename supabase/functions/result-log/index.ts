import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getReqContext } from '../_shared/context.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResultLogRequest {
  participant_id: string;
  session_id: string;
  q11_answer?: string;
  q12_answer?: string;
  q13_answer?: string;
  q14_answer?: string;
  q15_answer?: string;
}

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

    const body: ResultLogRequest = await req.json();
    const { participant_id, session_id, q11_answer, q12_answer, q13_answer, q14_answer, q15_answer } = body;

    if (!participant_id || !session_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'participant_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ipAddress, deviceType } = getReqContext(req);

    console.log(`Logging search result for participant: ${participant_id}, session: ${session_id}`);

    const { data, error } = await supabase
      .from('search_result_log')
      .insert({
        participant_id,
        session_id,
        q11_answer: q11_answer || null,
        q12_answer: q12_answer || null,
        q13_answer: q13_answer || null,
        q14_answer: q14_answer || null,
        q15_answer: q15_answer || null,
        ip_address: ipAddress,
        device_type: deviceType
      })
      .select('id')
      .single();

    if (error) {
      console.error('Result log creation error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to log search result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Result logged with ID: ${data.id}`);

    return new Response(
      JSON.stringify({
        ok: true,
        result_log_id: data.id
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