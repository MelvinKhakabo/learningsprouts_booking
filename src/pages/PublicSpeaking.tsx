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
  getLatestChampionshipSettings,
  type TrackWithData,
} from '@/lib/queries';
import { bandForAges } from '@/lib/ageBands';
import type { ChampionshipSettings, Delivery } from '@/lib/types';

const DELIVERY_LABEL: Record<Delivery, string> = {
  in_person: 'In-Person',
  online: 'Online',
};

export default function PublicSpeaking() {
  const [tracks, setTracks] = useState<TrackWithData[] | null>(null);
  const [championship, setChampionship] = useState<ChampionshipSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProgramWithTracks('public-speaking').then((result) => {
      if (!result) {
        setError("Couldn't load Public Speaking labs right now. Please try again shortly.");
        return;
      }
      setTracks(result.tracks);
    });
    getLatestChampionshipSettings().then(setChampionship);
  }, []);

  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-20 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-sm uppercase tracking-widest text-ink/50"
        >
          Aug – Nov 2026 Term
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 font-display text-5xl font-black tracking-tight"
        >
          Public Speaking
        </motion.h1>
        <p className="mx-auto mt-4 max-w-xl text-ink/70">
          Confidence, debate, and professional communication — culminating in
          the Learning Sprouts Public Speaking Championship.
        </p>
      </section>

      <section className="mx-auto flex max-w-4xl flex-col gap-8 px-6 pb-24">
        {error && (
          <p className="rounded-2xl border border-ink/10 bg-white/60 p-6 text-center text-sm text-ink/70">
            {error}
          </p>
        )}

        {!error && !tracks && (
          <p className="text-center text-sm text-ink/50">Loading labs…</p>
        )}

        {tracks?.map((track, i) => {
          const band = bandForAges(track.age_min, track.age_max);
          const deliveries = Array.from(new Set(track.cohorts.map((c) => c.delivery)));

          return (
            <Card key={track.id} delay={i * 0.1}>
              <AgeBadge bandId={band.id} />
              <h2 className="mt-3 font-display text-2xl font-black">{track.name}</h2>
              {track.big_idea && <p className="mt-2 text-sm text-ink/70">{track.big_idea}</p>}

              {track.cohorts.length > 0 && (
                <div className="mt-5">
                  <ScheduleTable
                    rows={track.cohorts.map((c) => ({
                      label: DELIVERY_LABEL[c.delivery],
                      day: c.day_of_week,
                      time: `${c.start_time} – ${c.end_time}`,
                    }))}
                  />
                </div>
              )}

              {deliveries.map((delivery) => {
                const pricingForDelivery = track.pricing.filter((p) => p.delivery === delivery);
                if (pricingForDelivery.length === 0) return null;
                return (
                  <div key={delivery} className="mt-5">
                    <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink/50">
                      {DELIVERY_LABEL[delivery]} pricing
                    </p>
                    <PricingTable
                      rows={pricingForDelivery.map((p) => ({
                        classCount: p.class_count,
                        price: p.price,
                        currency: p.currency,
                      }))}
                    />
                  </div>
                );
              })}

              {track.cohorts.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink/50">
                    Select a specific class to register
                  </p>
                  <div className="flex flex-col gap-2">
                    {track.cohorts.map((cohort) => (
                      <Button
                        key={cohort.id}
                        to={`/register/${cohort.id}`}
                        variant="marigold"
                        className="justify-between"
                      >
                        Register — {DELIVERY_LABEL[cohort.delivery]} ({cohort.day_of_week})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <Card delay={0.3} tone="dark">
          <p className="font-mono text-xs uppercase tracking-wide text-cream/60">
            Annual Championship
          </p>
          <h2 className="mt-2 font-display text-2xl font-black">
            {championship?.theme ?? 'Theme to be announced'}
          </h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-cream/80">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={16} /> {championship?.event_date ?? 'Date TBC'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} /> {championship?.venue ?? 'Venue TBC'}
            </span>
          </div>
          <p className="mt-4 text-sm text-cream/70">
            Only students enrolled during the Aug–Nov term are eligible.
            Finalists complete a Prepared Speech (60%) and Impromptu round
            (40%), judged on content, confidence, delivery, engagement, and
            critical thinking.
          </p>
        </Card>
      </section>
    </main>
  );
}