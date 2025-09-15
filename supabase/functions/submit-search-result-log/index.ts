import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl!, serviceKey!);

function isUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);
}

function getClientInfo(req: Request) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip_address = (fwd.split(',')[0] || '').trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-client-ip') || null;
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  const device_type = /mobile|iphone|android/.test(ua)
    ? 'mobile'
    : /ipad|tablet/.test(ua)
    ? 'tablet'
    : 'desktop';
  return { ip_address, device_type };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { participant_id, session_id, responses } = body ?? {};

    if (!isUuid(participant_id)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid participant_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!isUuid(session_id)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (typeof responses !== 'object' || responses === null) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid responses' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure participant exists
    const { data: pExist, error: pErr } = await supabase
      .from('participants')
      .select('participant_id')
      .eq('participant_id', participant_id)
      .maybeSingle();

    if (pErr) console.error('participants select error', pErr);
    if (!pExist) {
      const { error: insP } = await supabase
        .from('participants')
        .insert([{ participant_id }]);
      if (insP) console.error('participants insert error', insP);
    }

    const { ip_address, device_type } = getClientInfo(req);

    // Insert search result log with questions 12-18
    const { error } = await supabase
      .from('search_result_log')
      .insert([{
        participant_id,
        session_id,
        q12_answer: String(responses.q12_answer ?? ''),
        q13_answer: String(responses.q13_answer ?? ''),
        q14_answer: String(responses.q14_answer ?? ''),
        q15_answer: String(responses.q15_answer ?? ''),
        q16_answer: String(responses.q16_answer ?? ''),
  q17_answer: String(responses.q17_answer ?? ''),
  q18_answer: Array.isArray(responses.q18_answer) ? JSON.stringify(responses.q18_answer) : String(responses.q18_answer ?? ''),
  q18_other_text: typeof responses.q18_other_text === 'string' ? responses.q18_other_text : '',
        ip_address,
        device_type
      }]);

    if (error) {
      console.error('Insert search_result_log error', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('submit-search-result-log exception', e);
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});