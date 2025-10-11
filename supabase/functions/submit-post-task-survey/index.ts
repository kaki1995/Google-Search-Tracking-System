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

    // Get client info first
    const { ip_address, device_type } = getClientInfo(req);

    const payload = {
      participant_id,
      session_id,
      q19_task_easy: responses.q1_task_easy ? Number(responses.q1_task_easy) : null,
      q20_task_quick: responses.q2_task_quick ? Number(responses.q2_task_quick) : null,
      q21_task_familiar: responses.q3_task_familiar ? Number(responses.q3_task_familiar) : null,
      q22_tool_reliable: responses.q4_tool_reliable ? Number(responses.q4_tool_reliable) : null,
      q23_tool_practical: responses.q5_tool_practical ? Number(responses.q5_tool_practical) : null,
      q24_tool_like: responses.q6_tool_like ? Number(responses.q6_tool_like) : null,
      q25_tool_easy_use: responses.q7_tool_easy_use ? Number(responses.q7_tool_easy_use) : null,
      q26_tool_clear_interaction: responses.q8_tool_clear_interaction ? Number(responses.q8_tool_clear_interaction) : null,
      q27_tool_control: responses.q9_tool_control ? Number(responses.q9_tool_control) : null,
      q28_tool_provides_info: responses.q10_tool_provides_info ? Number(responses.q10_tool_provides_info) : null,
      q29_tool_helps_complete: responses.q11_tool_helps_complete ? Number(responses.q11_tool_helps_complete) : null,
      q30_tool_useful: responses.q12_tool_useful ? Number(responses.q12_tool_useful) : null,
      q31_tool_too_much_info: responses.q13_tool_too_much_info ? Number(responses.q13_tool_too_much_info) : null,
      q32_tool_hard_focus: responses.q14_tool_hard_focus ? Number(responses.q14_tool_hard_focus) : null,
      q33_results_accurate: responses.q15_results_accurate ? Number(responses.q15_results_accurate) : null,
      q34_results_trustworthy: responses.q16_results_trustworthy ? Number(responses.q16_results_trustworthy) : null,
      q35_results_complete: responses.q17_results_complete ? Number(responses.q17_results_complete) : null,
      q36_results_relevant: responses.q18_results_relevant ? Number(responses.q18_results_relevant) : null,
      q37_results_useful: responses.q19_results_useful ? Number(responses.q19_results_useful) : null,
      q38_attention_check: responses.q22_attention_check ? Number(responses.q22_attention_check) : null,
      q39_contradictory_handling: Array.isArray(responses.q21_contradictory_handling) ? responses.q21_contradictory_handling : [],
      q40_purchase_likelihood: responses.q20_purchase_likelihood ? Number(responses.q20_purchase_likelihood) : null,
      q41_time_spent: String(responses.q23_time_spent ?? ''),
      q42_future_usage_feedback: String(responses.q24_future_usage_feedback ?? '')
    };

    // REMOVED: Question 22 validation restriction - store value without blocking progress
    // This allows users to continue regardless of their attention check answer

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

    const { error } = await supabase
      .from('post_task_survey')
      .insert([payload]);

    if (error) {
      console.error('Insert post_task_survey error', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('submit-post-task-survey exception', e);
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});