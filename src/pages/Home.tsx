import { motion } from 'framer-motion';
import Card from '@/components/Card';
import Button from '@/components/Button';
import AgeBadge from '@/components/AgeBadge';

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-24 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-sm uppercase tracking-widest text-ink/50"
        >
          Learning Sprouts Programs
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 font-display text-5xl font-black tracking-tight sm:text-6xl"
        >
          Future Skills.<br />Real Growth.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-ink/70"
        >
          Year-round programs building the skills kids actually need — from
          Scratch to public speaking to AI.
        </motion.p>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-2">
        <Card delay={0}>
          <div className="flex flex-wrap gap-2">
            <AgeBadge bandId="junior" />
            <AgeBadge bandId="middle" />
            <AgeBadge bandId="senior" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-black">Public Speaking</h2>
          <p className="mt-2 text-sm text-ink/70">
            Confidence, debate, and professional communication — culminating
            in the annual Championship.
          </p>
          <Button to="/public-speaking" className="mt-6" variant="marigold">
            Explore Labs
          </Button>
        </Card>

        <Card delay={0.1}>
          <div className="flex flex-wrap gap-2">
            <AgeBadge bandId="junior" />
            <AgeBadge bandId="middle" />
            <AgeBadge bandId="senior" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-black">AI &amp; Coding</h2>
          <p className="mt-2 text-sm text-ink/70">
            Scratch, Python, and AI/ML tracks — each one building toward a
            real, shareable project.
          </p>
          <Button to="/ai-coding" className="mt-6" variant="ink">
            Explore Tracks
          </Button>
        </Card>
      </section>
    </main>
  );
}