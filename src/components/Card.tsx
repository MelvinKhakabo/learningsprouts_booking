import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const TONE_STYLES = {
  light: 'border-ink/10 bg-white/60',
  dark: 'border-cream/15 bg-navy text-cream',
};

export default function Card({
  children,
  className = '',
  delay = 0,
  tone = 'light',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  tone?: 'light' | 'dark';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={`rounded-3xl border p-6 shadow-sm transition-shadow hover:shadow-md ${TONE_STYLES[tone]} ${className}`}
    >
      {children}
    </motion.div>
  );
}