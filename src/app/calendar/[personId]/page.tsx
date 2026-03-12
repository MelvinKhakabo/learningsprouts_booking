'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '@/lib/supabase';
import { format, addHours, isBefore } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamic import for Paystack (client-only)
const PaystackPop = dynamic(() => import('@paystack/inline-js'), {
  ssr: false,
});

export default function CalendarPage() {
  const { personId } = useParams<{ personId: string }>();
  const router = useRouter();

  const [personName, setPersonName] = useState('Instructor');
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: person } = await supabase
          .from('persons')
          .select('name')
          .eq('id', personId)
          .single();
        if (person) setPersonName(person.name);

        const { data, error } = await supabase
          .from('availabilities')
          .select('*')
          .eq('personId', personId)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setSlots(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [personId]);

  // Generate 1-hour slots from a range
  const generateHourSlots = (start: Date, end: Date) => {
    const hourSlots = [];
    let current = start;
    while (isBefore(current, end)) {
      const next = addHours(current, 1);
      if (isBefore(next, end) || next.getTime() === end.getTime()) {
        hourSlots.push({ start: current, end: next });
      }
      current = next;
    }
    return hourSlots;
  };

  // Filter ranges for selected day (timezone-safe)
  const dayRanges = selectedDate
    ? slots.filter(slot => {
        const slotDateStr = format(new Date(slot.start_time), 'yyyy-MM-dd');
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return slotDateStr === selectedDateStr;
      })
    : [];

  // Generate all 1-hour slots for the day
  const dayHourSlots = dayRanges.flatMap(range => generateHourSlots(new Date(range.start_time), new Date(range.end_time)));

const handlePayment = async () => {
  if (!email || !selectedSlot) {
    setPaymentError('Please select a slot and enter your email');
    return;
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    setPaymentError('Please enter a valid email address');
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  if (!publicKey) {
    setPaymentError('Payment system not configured');
    console.error('Missing NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY');
    return;
  }

  setLoadingPayment(true);
  setPaymentError(null);

  try {
    console.log('Creating pending booking...');

    const selected = dayHourSlots[selectedSlot];

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        personId,
        startTime: selected.start.toISOString(),
        endTime: selected.end.toISOString(),
        userEmail: email,
        status: 'pending',
        // paymentRef defaults to 'pending' in table
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking error:', bookingError);
      throw bookingError;
    }

    console.log('Booking created:', booking.id);

    console.log('Opening Paystack popup...');

    // Correct usage: PaystackPop is the default export
    const PaystackPopModule = await import('@paystack/inline-js');
    const PaystackPop = PaystackPopModule.default;

    const handler = PaystackPop.setup({
      key: publicKey,
      email: email,
      amount: 1300 * 100, // Ksh 1,300 in cents
      currency: 'KES',
      ref: booking.id,
      onClose: () => {
        console.log('Payment popup closed');
        setLoadingPayment(false);
        alert('Payment cancelled');
      },
      callback: (response) => {
        console.log('Payment success:', response);
        alert(`Payment successful! Reference: ${response.reference}`);
        setLoadingPayment(false);
      },
    });

    handler.openIframe();
  } catch (err: any) {
    console.error('Payment process failed:', err);
    setPaymentError(err.message || 'Payment failed - check console');
    setLoadingPayment(false);
  }
};

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-8 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-800 font-medium transition"
        >
          ← Back to instructors
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Availability for {personName}
        </h1>

        {loading && <p className="text-center text-gray-600 py-12">Loading...</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl text-center text-lg">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
            {/* Compact Month Calendar */}
            <Calendar
              onChange={(date) => setSelectedDate(date as Date)}
              value={selectedDate}
              tileClassName={({ date, view }) =>
                view === 'month' && slots.some(slot => {
                  const slotDateStr = format(new Date(slot.start_time), 'yyyy-MM-dd');
                  const dateStr = format(date, 'yyyy-MM-dd');
                  return slotDateStr === dateStr;
                })
                  ? 'highlight-day'
                  : null
              }
              className="mx-auto react-calendar-custom"
            />

            {/* Selected Day Slots & Payment */}
            {selectedDate && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  Available times on {format(selectedDate, 'MMMM d, yyyy')}
                </h2>

                {dayHourSlots.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      {dayHourSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`p-5 border rounded-lg text-center transition font-medium text-lg shadow-sm hover:shadow-md ${
                            selectedSlot === index 
                              ? 'border-amber-700 bg-white text-black font-bold' 
                              : 'border-black hover:border-amber-500 hover:bg-amber-50'
                          }`}
                          onClick={() => setSelectedSlot(index)}
                        >
                          {format(slot.start, 'h:mm a')} – {format(slot.end, 'h:mm a')}
                        </button>
                      ))}
                    </div>

                    {selectedSlot !== null && (
                      <div className="mt-8 p-6 bg-white border border-black rounded-xl">
                        <h3 className="text-xl font-semibold text- mb-4">
                          Confirm Booking: {format(dayHourSlots[selectedSlot].start, 'h:mm a')} – {format(dayHourSlots[selectedSlot].end, 'h:mm a')}
                        </h3>

                        <div className="mb-6">
                          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                            Your Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            required
                          />
                        </div>

                        <button
                          onClick={handlePayment}
                          disabled={!email || loadingPayment}
                          className={`w-full py-5 px-8 rounded-xl text-white font-bold text-xl transition shadow-lg ${
                            email && !loadingPayment
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {loadingPayment ? 'Processing...' : 'Confirm Booking & Pay Ksh 1,300'}
                        </button>

                        {paymentError && (
                          <p className="mt-4 text-red-600 text-center">{paymentError}</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600 text-center">No available slots on this day.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}