// src/app/api/paystack/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Read the raw JSON body
    const payload = await request.json();
    const event = payload.event;

    console.log('Paystack webhook received:', event);
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    // Basic security check: verify signature (recommended in production)
    // For now we skip full verification — add later with your secret key

    if (event === 'charge.success') {
      const reference = payload.data.reference;
      const status = payload.data.status; // should be 'success'
      const amountPaid = payload.data.amount / 100; // in KES

      // Find the booking using the reference (we set ref = booking.id earlier)
      const { data: booking, error: findError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', reference)
        .single();

      if (findError || !booking) {
        console.error('No booking found for reference:', reference);
        return NextResponse.json({ received: true, message: 'booking not found' }, { status: 404 });
      }

      if (booking.status !== 'pending') {
        console.log('Booking already processed:', booking.status);
        return NextResponse.json({ received: true, message: 'already processed' }, { status: 200 });
      }

      // Update booking to confirmed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          paymentRef: reference,
          amount: amountPaid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Failed to update booking:', updateError);
        return NextResponse.json({ received: true, message: 'update failed' }, { status: 500 });
      }

      console.log(`Booking ${booking.id} confirmed! Reference: ${reference}`);

      // Optional: send email confirmation here (add later with Resend/Nodemailer)

      return NextResponse.json({ received: true, message: 'success' }, { status: 200 });
    }

    // Ignore other events for now
    console.log('Ignored event:', event);
    return NextResponse.json({ received: true, message: 'event ignored' }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook processing failed:', err);
    return NextResponse.json({ received: true, message: 'internal error' }, { status: 500 });
  }
}

// Required for Next.js 13+ route handlers
export const config = {
  api: {
    bodyParser: true,
  },
};