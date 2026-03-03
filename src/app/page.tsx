'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; 
import { useRouter } from 'next/navigation';

export default function Home() {
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPersons() {
      try {
        const { data, error } = await supabase
          .from('persons')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setPersons(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load instructors');
      } finally {
        setLoading(false);
      }
    }

    fetchPersons();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-6 py-16 md:py-20">
      {/* Welcome Section */}
      <div className="text-center mb-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5">
          Welcome to Learning Sprouts Office Hours
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 font-medium">
          Book a session with one of our instructors below
        </p>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <p className="text-center text-gray-600 text-xl py-10">Loading instructors...</p>
      )}

      {error && (
        <div className="w-full max-w-xl mx-auto bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center text-lg">
          {error}
        </div>
      )}

      {!loading && !error && persons.length === 0 && (
        <p className="text-center text-gray-600 text-xl py-10">
          No instructors available at the moment.
        </p>
      )}

      {/* Instructor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {persons.map((person) => (
          <div
            key={person.id}
            className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 flex flex-col items-center text-center hover:scale-105"
            onClick={() => router.push(`/calendar/${person.id}`)}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {person.name}
            </h2>
            <p className="text-gray-600 text-lg">
              View availability and book a session
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}