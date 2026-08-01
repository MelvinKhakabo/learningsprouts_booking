import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Register() {
  const { cohortId } = useParams<{ cohortId: string }>();

  return (
    <main className="mx-auto min-h-[60vh] max-w-lg px-6 py-24 text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">
          Registration
        </p>
        <h1 className="mt-2 font-display text-3xl font-black">
          Coming in Phase 4
        </h1>
        <p className="mt-3 text-ink/70">
          The registration form and Paystack checkout for{' '}
          <span className="font-mono">{cohortId}</span> will render here.
        </p>
      </motion.div>
    </main>
  );
}