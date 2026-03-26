'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Person = {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
};

const roleMap: Record<string, string> = {
  'Ms. Helena': 'Education & Policy',
  'Ms. Kayla': 'Speaking Coach',
  'Ms. Liliane': 'Events & Culture',
  'Ms. Shorelle': 'Songwriter & Composer',
};

export default function Home() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPersons() {
      try {
        const { data, error } = await supabase
          .from('persons')
          .select('id, name, bio, imageUrl')
          .order('name', { ascending: true });

        if (error) throw error;
        setPersons((data as Person[]) || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load instructors';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchPersons();
  }, []);

  return (
    <main className="page-shell min-h-screen px-5 py-14 sm:px-6 md:px-8 md:py-18">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl text-center mx-auto">
          <p className="info-pill mx-auto mb-5">Learning Sprouts Office Hours</p>

          <h1 className="section-heading text-4xl font-bold leading-tight sm:text-5xl">
            Book a session with one of our instructors
          </h1>

          <p className="section-subheading mt-5 text-lg leading-8 sm:text-xl">
            Explore each instructor, review availability, and reserve a session
            in a calm, guided booking experience.
          </p>
        </div>

        {loading && (
          <p className="text-center text-lg text-[var(--text-secondary)] py-10">
            Loading instructors...
          </p>
        )}

        {error && (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-[var(--danger-soft)] p-6 text-center text-lg text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && persons.length === 0 && (
          <p className="text-center text-lg text-[var(--text-secondary)] py-10">
            No instructors available at the moment.
          </p>
        )}

        {!loading && !error && persons.length > 0 && (
          <div className="instructor-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {persons.map((person) => (
              <article
                key={person.id}
                className="instructor-card p-6 sm:p-7"
                onClick={() => router.push(`/calendar/${person.id}`)}
              >
                <div className="instructor-image-wrap">
                  <Image
                    src={person.imageUrl || '/images/placeholder.jpg'}
                    alt={person.name}
                    fill
                    sizes="(max-width: 640px) 128px, 144px"
                    className="instructor-image"
                  />
                </div>

                <h2 className="instructor-name mb-3 text-3xl font-bold">
                  {person.name}
                </h2>

                <div className="instructor-role">
                  {roleMap[person.name] || 'Instructor'}
                </div>

                <div className="instructor-bio-wrap px-1">
                  <p className="instructor-bio text-base">
                    {person.bio || 'No bio available yet.'}
                  </p>
                </div>

                <div className="instructor-card-spacer" />

                <button
                  className="brand-button mt-2 w-full px-5 py-3.5 text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/calendar/${person.id}`);
                  }}
                >
                  View availability
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}