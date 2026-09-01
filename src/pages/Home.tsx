import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import AgeBadge from '@/components/AgeBadge';

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello, I'd like to join the Learning Sprouts WhatsApp community"
);
const WHATSAPP_LINK = `https://wa.me/254719218992?text=${WHATSAPP_MESSAGE}`;

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-marigold-dark">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <main className="flex h-full flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Eyebrow>Learning Sprouts Programs</Eyebrow>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-center font-display text-6xl font-black leading-[0.95] tracking-tight sm:text-7xl"
        >
          Future Skills.<br />Real Growth.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-center text-lg text-ink/70"
        >
          Learning Sprouts is a Kenya based future skills training provider
          founded by Harvard University graduates. We offer research driven
          programs that help students build academic excellence, creativity,
          leadership, and real world problem solving skills.
        </motion.p>
      </section>

      {/* Programs */}
      <section className="border-t border-ink/10 bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
            className="mb-14 text-center"
          >
            <Eyebrow>What We Offer</Eyebrow>
            <h2 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
              Explore Our Year-Long Programs
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
            <Card delay={0}>
              <div className="flex flex-wrap items-center gap-2">
                <AgeBadge bandId="junior" />
                <AgeBadge bandId="middle" />
                <AgeBadge bandId="senior" />
              </div>

              <h3 className="mt-5 font-display text-3xl font-black">
                Public Speaking
              </h3>

              <p className="mt-3 text-base text-ink/70">
                Confidence, debate, and professional communication —
                culminating in the annual Championship.
              </p>

              <div className="mt-auto pt-8">
                <Button
                  to="/public-speaking"
                  className="self-center"
                  variant="marigold"
                >
                  Explore Labs
                </Button>
              </div>
            </Card>

            <Card delay={0.1}>
              <div className="flex flex-wrap items-center gap-2">
                <AgeBadge bandId="junior" />
                <AgeBadge bandId="middle" />
                <AgeBadge bandId="senior" />
              </div>

              <h3 className="mt-5 font-display text-3xl font-black">
                AI &amp; Coding
              </h3>

              <p className="mt-3 text-base text-ink/70">
                Scratch, Python, and AI/ML tracks — each one building toward
                a real, shareable project.
              </p>

              <div className="mt-auto pt-8">
                <Button
                  to="/ai-coding"
                  className="self-center"
                  variant="ink"
                >
                  Explore Tracks
                </Button>
              </div>
            </Card>

            <Card delay={0.2}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
                  High School
                  <span className="font-mono font-normal normal-case tracking-normal opacity-70">
                    13–18
                  </span>
                </span>
              </div>

              <motion.span
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-xs font-semibold text-cream"
              >
                Competition Date: 30th January 2027
              </motion.span>

              <h3 className="mt-5 font-display text-3xl font-black">
                PUMaC Africa
              </h3>

              <p className="mt-3 text-base text-ink/70">
                Join Africa's first Ivy League Mathematics Competition
                (PUMaC) with Learning Sprouts and Princeton University Math
                Club.
              </p>

              <div className="mt-auto pt-8">
                <Button
                  href="https://pumac-africa.learningsprouts.school/"
                  className="self-center"
                  variant="marigold"
                >
                  Explore Competition
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* WhatsApp community callout — flex-1 so it always reaches the footer */}
      <section className="flex flex-1 items-center border-t border-ink/10 bg-peach/40 py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
          >
            <Eyebrow>Stay Updated</Eyebrow>

            <h2 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
              Be the First to Know About Our Upcoming Programs
            </h2>

            <p className="mx-auto mt-6 max-w-md text-lg text-ink/70">
              Join our WhatsApp community for early access to new programs,
              open registration dates, and updates from the Learning Sprouts
              team.
            </p>

            <Button href={WHATSAPP_LINK} className="mt-8" variant="marigold">
              <MessageCircle size={18} />
              Join Our WhatsApp Community
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
