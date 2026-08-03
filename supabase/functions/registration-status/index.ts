import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing env vars");
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const { registrationId } = await req.json();

    if (!registrationId) {
      return jsonResponse({ error: "Missing registrationId" }, 400);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Only ever return the minimum needed to render a status message —
    // never the full row, even though this runs with service-role access.
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .select("payment_status")
      .eq("id", registrationId)
      .single();

    if (error || !data) {
      return jsonResponse({ found: false }, 200);
    }

    return jsonResponse({ found: true, payment_status: data.payment_status });
  } catch (err) {
    console.error("Unhandled error in registration-status:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});