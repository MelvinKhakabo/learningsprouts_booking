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
  // Answer preflight immediately — before reading any env vars or
  // creating any clients, so a config problem can never block this.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing env vars", {
        hasPaystack: !!PAYSTACK_SECRET_KEY,
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
      });
      return jsonResponse({ error: "Server misconfigured: missing required environment variables" }, 500);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { reference, registrationId } = await req.json();

    if (!reference || !registrationId) {
      return jsonResponse({ error: "Missing reference or registrationId" }, 400);
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const verifyText = await verifyRes.text();
    let verifyData: any;
    try {
      verifyData = JSON.parse(verifyText);
    } catch {
      console.error("Paystack response was not valid JSON:", verifyText);
      return jsonResponse({ error: "Invalid response from Paystack" }, 502);
    }

    if (!verifyRes.ok) {
      console.error("Paystack verify call failed:", verifyRes.status, verifyData);
      return jsonResponse(
        { error: "Paystack verification request failed", details: verifyData },
        502
      );
    }

    const paystackStatus: string | undefined = verifyData.data?.status;

    let newStatus: "paid" | "cancelled" | "failed";
    if (paystackStatus === "success") {
      newStatus = "paid";
    } else if (paystackStatus === "abandoned") {
      newStatus = "cancelled";
    } else {
      newStatus = "failed";
    }

    const { error: updateError } = await supabaseAdmin
      .from("registrations")
      .update({ payment_status: newStatus, paystack_reference: reference })
      .eq("id", registrationId);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return jsonResponse({ error: "Failed to update registration" }, 500);
    }

    return jsonResponse({ verified: newStatus === "paid", status: newStatus });
  } catch (err) {
    console.error("Unhandled error in verify-payment:", err);
    return jsonResponse({ error: "Internal error", details: String(err) }, 500);
  }
});