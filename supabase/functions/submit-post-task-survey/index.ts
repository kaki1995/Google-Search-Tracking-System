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
      responses: {
        q19_topic_familiarity: Number(responses.q19_topic_familiarity ?? 0),
        q20_google_ease: Number(responses.q20_google_ease ?? 0),
        q21_google_satisfaction: Number(responses.q21_google_satisfaction ?? 0),
        q22_google_relevance: Number(responses.q22_google_relevance ?? 0),
        q23_google_trust: Number(responses.q23_google_trust ?? 0),
        q24_contradictory_handling: String(responses.q24_contradictory_handling ?? ''),
        q25_tool_effectiveness: Number(responses.q25_tool_effectiveness ?? 0),
        q26_task_duration: String(responses.q26_task_duration ?? ''),
        q27_first_response_satisfaction: Number(responses.q27_first_response_satisfaction ?? 0),
        q28_attention_check: Number(responses.q28_attention_check ?? 0),
        q29_future_usage_feedback: String(responses.q29_future_usage_feedback ?? '')
      }
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