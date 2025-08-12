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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { participant_id, responses } = body ?? {};

    if (!isUuid(participant_id)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid participant_id' }), {
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

    // Basic field normalization and validation
    const payload = {
      q1_age_group: String(responses.q1_age_group ?? ''),
      q2_gender: String(responses.q2_gender ?? ''),
      q3_education: String(responses.q3_education ?? ''),
      q4_employment_status: String(responses.q4_employment_status ?? ''),
      q5_nationality: String(responses.q5_nationality ?? ''),
      q6_country_residence: String(responses.q6_country_residence ?? ''),
      q7_ai_familiarity: Number(responses.q7_ai_familiarity ?? 0),
      q8_attention_check: Number(responses.q8_attention_check ?? 0),
      q9_ai_usage_frequency: String(responses.q9_ai_usage_frequency ?? ''),
    };

    // Attention check (Q8 should be 1 per instructions)
    if (payload.q8_attention_check !== 1) {
      return new Response(JSON.stringify({ ok: false, error: 'Attention check failed (Q8 must be 1)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure participant exists (idempotent)
    const { data: pExist, error: pErr } = await supabase
      .from('participants')
      .select('participant_id')
      .eq('participant_id', participant_id)
      .maybeSingle();

    if (pErr) {
      console.error('participants select error', pErr);
    }
    if (!pExist) {
      const { error: insP } = await supabase
        .from('participants')
        .insert([{ participant_id }]);
      if (insP) {
        console.error('participants insert error', insP);
      }
    }

    const { error } = await supabase
      .from('background_survey')
      .insert([{ participant_id, responses: payload }]);

    if (error) {
      console.error('Insert background_survey error', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('submit-background-survey exception', e);
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
