
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '@/lib/supabase';
import { addHours, format, isBefore } from 'date-fns';

type AvailabilitySlot = {
  id?: string | number;
  personId?: string;
  start_time: string | null;
  end_time: string | null;
};

type HourSlot = {
  start: Date;
  end: Date;
};

type PersonRecord = {
  name: string;
  rateUsd: number | null;
};

type PaystackSuccessResponse = {
  reference?: string;
  [key: string]: unknown;
};

const USD_TO_KES = 127;

function toValidDate(value: unknown): Date | null {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean'
  ) {
    return null;
  }

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function CalendarPage() {
  const { personId } = useParams<{ personId: string }>();
  const router = useRouter();

  const [personName, setPersonName] = useState('Instructor');
  const [personRateUsd, setPersonRateUsd] = useState<number | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
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
        const { data: person, error: personError } = await supabase
          .from('persons')
          .select('name, rateUsd')
          .eq('id', personId)
          .single<PersonRecord>();

        if (personError) throw personError;

        if (person) {
          setPersonName(person.name);
          setPersonRateUsd(person.rateUsd);
        }

        const { data, error: availabilityError } = await supabase
          .from('availabilities')
          .select('*')
          .eq('personId', personId)
          .order('start_time', { ascending: true });

        if (availabilityError) throw availabilityError;

        setSlots((data as AvailabilitySlot[]) || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load availability';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [personId]);

  const generateHourSlots = (start: Date, end: Date): HourSlot[] => {
    const hourSlots: HourSlot[] = [];
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

  const amountKes = useMemo(() => {
    if (personRateUsd === null || personRateUsd <= 0) return 0;
    return Math.round(personRateUsd * USD_TO_KES);
  }, [personRateUsd]);

  const amountPaystack = useMemo(() => amountKes * 100, [amountKes]);

  const dayRanges = useMemo(() => {
    if (!selectedDate) return [];

    return slots.filter((slot) => {
      const slotDate = toValidDate(slot.start_time);
      if (!slotDate) return false;

      return (
        format(slotDate, 'yyyy-MM-dd') ===
        format(selectedDate, 'yyyy-MM-dd')
      );
    });
  }, [selectedDate, slots]);

  const dayHourSlots = useMemo(() => {
    return dayRanges.flatMap((range) => {
      const start = toValidDate(range.start_time);
      const end = toValidDate(range.end_time);

      if (!start || !end) return [];
      return generateHourSlots(start, end);
    });
  }, [dayRanges]);

  const handlePayment = async () => {
    if (!email || selectedSlot === null) {
      setPaymentError('Please select a slot and enter your email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setPaymentError('Please enter a valid email address');
      return;
    }

    if (!personRateUsd || amountKes <= 0) {
      setPaymentError('This instructor does not have a valid rate configured');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!publicKey) {
      setPaymentError('Payment system not configured');
      console.error('Missing NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY');
      return;
    }

    const selected = dayHourSlots[selectedSlot];

    if (!selected) {
      setPaymentError('Selected slot is invalid');
      return;
    }

    setLoadingPayment(true);
    setPaymentError(null);

    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          personId,
          startTime: selected.start.toISOString(),
          endTime: selected.end.toISOString(),
          userEmail: email,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      const PaystackPopModule = await import('@paystack/inline-js');
      const PaystackPop = PaystackPopModule.default ?? PaystackPopModule;

      const popup = new PaystackPop();

      popup.newTransaction({
        key: publicKey,
        email,
        amount: amountPaystack,
        currency: 'KES',
        reference: booking.id,
        onCancel: () => {
          setLoadingPayment(false);
          alert('Payment cancelled');
        },
        onSuccess: (response: PaystackSuccessResponse) => {
          console.log('Payment success:', response);
          alert(`Payment successful! Reference: ${response.reference ?? booking.id}`);
          setLoadingPayment(false);
        },
        onError: (err: unknown) => {
          console.error('Paystack error:', err);
          setPaymentError('Payment failed - please try again');
          setLoadingPayment(false);
        },
      });
    } catch (err: unknown) {
      console.error('Payment process failed:', err);
      const message =
        err instanceof Error ? err.message : 'Payment failed - check console';
      setPaymentError(message);
      setLoadingPayment(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="mb-8 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-800 transition hover:bg-gray-50"
        >
          ← Back to instructors
        </button>

        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
          Availability for {personName}
        </h1>

        {loading && (
          <p className="py-12 text-center text-gray-600">Loading...</p>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-lg text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-md">
            <Calendar
              onChange={(date) => {
                setSelectedDate(date as Date);
                setSelectedSlot(null);
                setPaymentError(null);
              }}
              value={selectedDate}
              tileClassName={({ date, view }) =>
                view === 'month' &&
                slots.some((slot) => {
                  const slotDate = toValidDate(slot.start_time);
                  if (!slotDate) return false;

                  return (
                    format(slotDate, 'yyyy-MM-dd') ===
                    format(date, 'yyyy-MM-dd')
                  );
                })
                  ? 'highlight-day'
                  : null
              }
              className="react-calendar-custom mx-auto"
            />

            {selectedDate && (
              <div className="mt-10">
                <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">
                  Available times on {format(selectedDate, 'MMMM d, yyyy')}
                </h2>

                {dayHourSlots.length > 0 ? (
                  <>
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {dayHourSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`rounded-lg border p-5 text-center text-lg font-medium shadow-sm transition hover:shadow-md ${
                            selectedSlot === index
                              ? 'border-amber-700 bg-white font-bold text-black'
                              : 'border-black hover:border-amber-500 hover:bg-amber-50'
                          }`}
                          onClick={() => {
                            setSelectedSlot(index);
                            setPaymentError(null);
                          }}
                        >
                          {format(slot.start, 'h:mm a')} –{' '}
                          {format(slot.end, 'h:mm a')}
                        </button>
                      ))}
                    </div>

                    {selectedSlot !== null && dayHourSlots[selectedSlot] && (
                      <div className="mt-8 rounded-xl border border-black bg-white p-6">
                        <h3 className="mb-4 text-xl font-semibold">
                          Confirm Booking:{' '}
                          {format(dayHourSlots[selectedSlot].start, 'h:mm a')} –{' '}
                          {format(dayHourSlots[selectedSlot].end, 'h:mm a')}
                        </h3>

                        <p className="mb-2 text-gray-700">
                          Rate: USD {personRateUsd?.toLocaleString() ?? 'N/A'}
                        </p>
                        <p className="mb-6 text-lg font-semibold text-gray-900">
                          Amount due: KSh {amountKes.toLocaleString()}
                        </p>

                        <div className="mb-6">
                          <label
                            htmlFor="email"
                            className="mb-2 block font-medium text-gray-700"
                          >
                            Your Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                            required
                          />
                        </div>

                        <button
                          onClick={handlePayment}
                          disabled={!email || loadingPayment || amountKes <= 0}
                          className={`w-full rounded-xl px-8 py-5 text-xl font-bold text-white transition shadow-lg ${
                            email && !loadingPayment && amountKes > 0
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'cursor-not-allowed bg-gray-400'
                          }`}
                        >
                          {loadingPayment
                            ? 'Processing...'
                            : `Confirm Booking & Pay KSh ${amountKes.toLocaleString()}`}
                        </button>

                        {paymentError && (
                          <p className="mt-4 text-center text-red-600">
                            {paymentError}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-600">
                    No available slots on this day.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}