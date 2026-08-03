import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computedHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computedHex === signature;
}

function parseRegistrationId(reference: string): string | null {
  // Our references are formatted as reg_<registrationId>_<timestamp>
  const parts = reference.split("_");
  if (parts.length !== 3 || parts[0] !== "reg") return null;
  return parts[1];
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing env vars in paystack-webhook");
      return new Response("Server misconfigured", { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Missing x-paystack-signature header");
      return new Response("Missing signature", { status: 401 });
    }

    const isValid = await verifySignature(rawBody, signature, PAYSTACK_SECRET_KEY);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("Verified webhook event:", event.event);

    // Only act on the events that map to our status model — ignore the rest.
    if (event.event !== "charge.success" && event.event !== "charge.failed") {
      return new Response("ok", { status: 200 });
    }

    const reference: string | undefined = event.data?.reference;
    if (!reference) {
      console.error("Webhook missing reference");
      return new Response("ok", { status: 200 });
    }

    const registrationId = parseRegistrationId(reference);
    if (!registrationId) {
      console.error("Could not parse registrationId from reference:", reference);
      return new Response("ok", { status: 200 });
    }

    const newStatus = event.event === "charge.success" ? "paid" : "failed";

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Idempotent: only overwrite if not already marked paid, so a delayed
    // webhook can never downgrade a registration the browser already
    // confirmed as paid.
    const { data: existing } = await supabaseAdmin
      .from("registrations")
      .select("payment_status")
      .eq("id", registrationId)
      .single();

    if (existing?.payment_status === "paid") {
      return new Response("ok", { status: 200 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("registrations")
      .update({ payment_status: newStatus, paystack_reference: reference })
      .eq("id", registrationId);

    if (updateError) {
      console.error("Webhook DB update error:", updateError);
      return new Response("Update failed", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Unhandled error in paystack-webhook:", err);
    return new Response("Internal error", { status: 500 });
  }
});