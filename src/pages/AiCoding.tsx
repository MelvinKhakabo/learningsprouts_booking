import { Calendar, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/Card';
import AgeBadge from '@/components/AgeBadge';
import ScheduleTable from '@/components/ScheduleTable';
import PricingTable from '@/components/PricingTable';
import Button from '@/components/Button';
import {
  getProgramWithTracks,
  getLatestAiCompetitionSettings,
  type TrackWithData,
} from '@/lib/queries';
import { bandForAges } from '@/lib/ageBands';
import { computeUpcomingCycles, formatCycleLabel } from '@/lib/cycles';
import type { AiCompetitionSettings } from '@/lib/types';

export default function AiCoding() {
  const [tracks, setTracks] = useState<TrackWithData[] | null>(null);
  const [competition, setCompetition] = useState<AiCompetitionSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProgramWithTracks('ai-coding').then((result) => {
      if (!result) {
        setError("Couldn't load AI & Coding tracks right now. Please try again shortly.");
        return;
      }
      setTracks(result.tracks);
    });
    getLatestAiCompetitionSettings().then(setCompetition);
  }, []);

  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-20 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-sm uppercase tracking-widest text-ink/50"
        >
          Rolling enrollment — 5-Saturday cycles, paused in December
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 font-display text-5xl font-black tracking-tight"
        >
          AI &amp; Coding
        </motion.h1>
        <p className="mx-auto mt-4 max-w-xl text-ink/70">
          Three tracks, one for every stage — join any upcoming cycle.
        </p>
      </section>

      <section className="mx-auto flex max-w-4xl flex-col gap-8 px-6 pb-24">
        {error && (
          <p className="rounded-2xl border border-ink/10 bg-white/60 p-6 text-center text-sm text-ink/70">
            {error}
          </p>
        )}

        {!error && !tracks && (
          <p className="text-center text-sm text-ink/50">Loading tracks…</p>
        )}

        {!error && tracks && tracks.length === 0 && (
          <p className="text-center text-sm text-ink/50">
            No tracks are open right now — check back soon.
          </p>
        )}

        {tracks?.map((track, i) => {
          const band = bandForAges(track.age_min, track.age_max);
          const cohort = track.cohorts[0]; // AI/Coding: one cohort per track
          const upcomingCycles = cohort ? computeUpcomingCycles(cohort, 3) : [];

          const scheduleRows = cohort
            ? [
                { label: 'Class', day: cohort.day_of_week, time: `${cohort.start_time} – ${cohort.end_time}` },
                ...(cohort.office_hours_day
                  ? [
                      {
                        label: 'Office Hours',
                        day: cohort.office_hours_day,
                        time: `${cohort.office_hours_start} – ${cohort.office_hours_end}`,
                      },
                    ]
                  : []),
              ]
            : [];

          return (
            <Card key={track.id} delay={i * 0.1}>
              <div className="flex flex-wrap items-center gap-3">
                <AgeBadge bandId={band.id} />
                {cohort && (
                  <span className="font-mono text-xs uppercase tracking-wide text-ink/50">
                    {cohort.delivery === 'in_person' ? 'In-Person' : 'Online'}
                  </span>
                )}
              </div>

              <h2 className="mt-3 font-display text-2xl font-black">{track.name}</h2>
              {track.big_idea && <p className="mt-2 text-sm text-ink/70">{track.big_idea}</p>}

              {cohort && (
                <>
                  <div className="mt-5">
                    <ScheduleTable rows={scheduleRows} />
                  </div>

                  {track.pricing.length > 0 && (
                    <div className="mt-5">
                      <PricingTable
                        rows={track.pricing.map((p) => ({
                          classCount: p.class_count,
                          price: p.price,
                          currency: p.currency,
                        }))}
                        highlightIndex={track.pricing.length - 1}
                      />
                    </div>
                  )}

                  {upcomingCycles.length > 0 && (
                    <div className="mt-6">
                      <p className="font-mono text-xs uppercase tracking-wide text-ink/50">
                        Upcoming Training Cycles
                      </p>
                      <div className="mt-2 flex flex-col gap-2">
                        {upcomingCycles.map((cycle) => (
                          <Button
                            key={cycle.cycleNumber}
                            to={`/register/${cohort.id}?cycle=${cycle.cycleNumber}&dates=${cycle.sessionDates.join(',')}`}
                            variant="soft"
                            className="justify-between"
                          >
                            <span>{formatCycleLabel(cycle)}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}

        <Card delay={0.3} tone="dark">
          <span className="inline-block rounded-full bg-marigold px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-cream">
            Coming Soon
          </span>
          <h2 className="mt-3 font-display text-2xl font-black">
            {competition?.name ?? 'AI & Coding Competition'}
          </h2>
          <p className="mt-2 text-sm text-cream/70">
            An exciting new competition for AI &amp; Coding students —
            details on the way.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-cream/80">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={16} /> {competition?.event_date ?? 'Date TBC'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} /> {competition?.venue ?? 'Venue TBC'}
            </span>
          </div>
        </Card>
      </section>
    </main>
  );
}