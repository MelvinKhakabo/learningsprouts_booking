import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getRegistrationConfirmation } from '@/lib/queries';
import type { RegistrationConfirmation } from '@/lib/types';

const STATUS_CONTENT = {
  paid: {
    icon: CheckCircle2,
    iconClass: 'text-marigold',
    title: 'Payment confirmed',
    body: "You're all set. We'll be in touch with anything you need before your first class.",
  },
  pending: {
    icon: Clock,
    iconClass: 'text-ink/50',
    title: 'Payment pending',
    body: 'Your registration is saved, but payment hasn\'t been completed yet.',
  },
  cancelled: {
    icon: XCircle,
    iconClass: 'text-ink/50',
    title: 'Payment not completed',
    body: 'Checkout was closed before payment finished. Your registration is still saved.',
  },
  failed: {
    icon: XCircle,
    iconClass: 'text-red-500',
    title: 'Payment failed',
    body: 'The payment attempt didn\'t go through. Your registration is still saved — you can try again.',
  },
};

export default function ThankYou() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const [confirmation, setConfirmation] = useState<RegistrationConfirmation | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!registrationId) return;
    getRegistrationConfirmation(registrationId).then((result) => {
      if (!result) {
        setNotFound(true);
        return;
      }
      setConfirmation(result);
    });
  }, [registrationId]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-ink/70">
          We couldn't find that registration. Double check the link, or
          contact us if you need help.
        </p>
      </main>
    );
  }

  if (!confirmation) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-ink/50">Loading…</p>
      </main>
    );
  }

  const status = STATUS_CONTENT[confirmation.payment_status];
  const Icon = status.icon;

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Icon className={`mx-auto ${status.iconClass}`} size={40} />
        <h1 className="mt-4 font-display text-2xl font-black">{status.title}</h1>
        <p className="mt-3 text-ink/70">{status.body}</p>
      </motion.div>
    </main>
  );
}