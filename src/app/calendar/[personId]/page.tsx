'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function CalendarPage() {
  const { personId } = useParams<{ personId: string }>();
  const router = useRouter();

  const [personName, setPersonName] = useState('Instructor');
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.log('Fetching availability for personId:', personId);

      try {
        // Get instructor name
        const { data: person } = await supabase
          .from('persons')
          .select('name')
          .eq('id', personId)
          .single();
        if (person) setPersonName(person.name);

        // Get availability slots
        const { data, error } = await supabase
          .from('availabilities')
          .select('*')
          .eq('personId', personId) // ← using 'personId' to match your table column
          .order('start_time', { ascending: true });

        console.log('Supabase fetch result:', { data: data?.length || 0, error });

        if (error) throw error;
        setSlots(data || []);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [personId]);

  // Debug: Log all slots with parsed dates
  console.log('All availability slots:', slots.map(s => ({
    id: s.id,
    start_time: s.start_time,
    end_time: s.end_time,
    dateStr: format(new Date(s.start_time), 'yyyy-MM-dd')
  })));

  // Filter slots by selected day (timezone-safe string comparison)
  const daySlots = selectedDate
    ? slots.filter(slot => {
        const slotDateStr = format(new Date(slot.start_time), 'yyyy-MM-dd');
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        const matches = slotDateStr === selectedDateStr;

        // Debug log for clicked day
        console.log(`Checking slot ${slot.id}: ${slotDateStr} vs ${selectedDateStr} → ${matches ? 'MATCH' : 'NO MATCH'}`);

        return matches;
      })
    : [];

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

            {/* Selected Day Slots */}
            {selectedDate && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  Available times on {format(selectedDate, 'MMMM d, yyyy')}
                </h2>

                {daySlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {daySlots.map(slot => (
                      <button
                        key={slot.id}
                        className="p-5 border border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 text-center transition font-medium text-lg shadow-sm hover:shadow-md"
                        onClick={() => alert(`Selected: ${format(new Date(slot.start_time), 'h:mm a')} – ${format(new Date(slot.end_time), 'h:mm a')}\nNext: Enter email & pay`)}
                      >
                        {format(new Date(slot.start_time), 'h:mm a')} – {format(new Date(slot.end_time), 'h:mm a')}
                      </button>
                    ))}
                  </div>
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