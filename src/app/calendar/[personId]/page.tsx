'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '@/lib/supabase';
import { format, addHours, isBefore } from 'date-fns';

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
  if (value === null || value === undefined || typeof value === 'boolean') {
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

    const now = new Date();

    return slots.filter((slot) => {
      const start = toValidDate(slot.start_time);
      const end = toValidDate(slot.end_time);

      if (!start || !end) return false;
      if (end <= now) return false;

      return (
        format(start, 'yyyy-MM-dd') ===
        format(selectedDate, 'yyyy-MM-dd')
      );
    });
  }, [selectedDate, slots]);

  const dayHourSlots = useMemo(() => {
    const now = new Date();

    return dayRanges
      .flatMap((range) => {
        const start = toValidDate(range.start_time);
        const end = toValidDate(range.end_time);

        if (!start || !end) return [];
        return generateHourSlots(start, end);
      })
      .filter((slot) => slot.end > now);
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
      return;
    }

    const selected = dayHourSlots[selectedSlot];

    if (!selected || selected.end <= new Date()) {
      setPaymentError('This slot has already passed. Please choose another one.');
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

      if (bookingError) throw bookingError;

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
          alert(`Payment successful! Reference: ${response.reference ?? booking.id}`);
          setLoadingPayment(false);
        },
        onError: () => {
          setPaymentError('Payment failed. Please try again.');
          setLoadingPayment(false);
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setPaymentError(message);
      setLoadingPayment(false);
    }
  };

  return (
    <main className="page-shell min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.back()}
          className="brand-button-soft mb-8 px-5 py-3 text-sm sm:text-base"
        >
          ← Back to instructors
        </button>

        <div className="mb-8 text-center">
          <p className="info-pill mb-4">Book with {personName}</p>

          <h1 className="section-heading text-3xl font-bold sm:text-4xl">
            Choose a date and time
          </h1>

          <p className="section-subheading mx-auto mt-4 max-w-2xl text-base leading-7 sm:text-lg">
            Select an available one-hour session and complete your booking below.
          </p>
        </div>

        {loading && (
          <p className="py-12 text-center text-lg text-[var(--text-secondary)]">
            Loading availability...
          </p>
        )}

        {error && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-[var(--danger-soft)] p-6 text-center text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="booking-shell mx-auto max-w-4xl p-5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
              <div className="soft-panel rounded-[1.35rem] p-4 sm:p-5">
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
                      const start = toValidDate(slot.start_time);
                      const end = toValidDate(slot.end_time);

                      if (!start || !end) return false;
                      if (end <= new Date()) return false;

                      return (
                        format(start, 'yyyy-MM-dd') ===
                        format(date, 'yyyy-MM-dd')
                      );
                    })
                      ? 'highlight-day'
                      : null
                  }
                  className="react-calendar-custom"
                />
              </div>

              <div>
                {selectedDate ? (
                  <div>
                    <h2 className="section-heading text-center text-2xl font-bold sm:text-left">
                      Available times on {format(selectedDate, 'MMMM d, yyyy')}
                    </h2>

                    <p className="muted-copy mt-2 mb-6 text-center text-sm sm:text-left sm:text-base">
                      Tap a time slot to continue.
                    </p>

                    {dayHourSlots.length > 0 ? (
                      <>
                        <div className="slot-grid mb-8">
                          {dayHourSlots.map((slot, index) => {
                            const isSelected = selectedSlot === index;

                            return (
                              <button
                                key={index}
                                type="button"
                                className={`slot-button ${isSelected ? 'slot-button-selected' : ''}`}
                                onClick={() => {
                                  setSelectedSlot(index);
                                  setPaymentError(null);
                                }}
                              >
                                {format(slot.start, 'h:mm a')} – {format(slot.end, 'h:mm a')}
                              </button>
                            );
                          })}
                        </div>

                        {selectedSlot !== null && dayHourSlots[selectedSlot] && (
                          <div className="booking-summary p-5 sm:p-6">
                            <div className="mb-5">
                              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                Selected session
                              </p>
                              <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                                {format(dayHourSlots[selectedSlot].start, 'h:mm a')} –{' '}
                                {format(dayHourSlots[selectedSlot].end, 'h:mm a')}
                              </h3>
                            </div>

                            <div className="mb-6 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-[#eadfc9] bg-white px-4 py-3">
                                <p className="text-sm text-[var(--text-muted)]">Rate</p>
                                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                                  USD {personRateUsd?.toLocaleString() ?? 'N/A'}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#eadfc9] bg-white px-4 py-3">
                                <p className="text-sm text-[var(--text-muted)]">Amount due</p>
                                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                                  KSh {amountKes.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="mb-5">
                              <label htmlFor="email" className="field-label mb-2 block">
                                Your email address
                              </label>
                              <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="field-input"
                                required
                              />
                            </div>

                            <button
                              onClick={handlePayment}
                              disabled={!email || loadingPayment || amountKes <= 0}
                              className="brand-button w-full px-6 py-4 text-lg"
                            >
                              {loadingPayment
                                ? 'Processing...'
                                : `Confirm Booking & Pay KSh ${amountKes.toLocaleString()}`}
                            </button>

                            {paymentError && (
                              <p className="mt-4 text-center text-sm font-medium text-red-600">
                                {paymentError}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="soft-panel rounded-2xl p-6 text-center">
                        <p className="muted-copy">
                          No available slots remain on this day.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="soft-panel rounded-2xl p-8 text-center">
                    <p className="muted-copy text-base sm:text-lg">
                      Select a date on the calendar to view available one-hour sessions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}