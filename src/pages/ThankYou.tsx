import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getRegistrationStatus } from '@/lib/queries';

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
  const [status, setStatus] = useState<keyof typeof STATUS_CONTENT | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!registrationId) return;
    getRegistrationStatus(registrationId).then((result) => {
      if (!result || !result.found || !result.payment_status) {
        setNotFound(true);
        return;
      }
      setStatus(result.payment_status);
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

  if (!status) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-ink/50">Loading…</p>
      </main>
    );
  }

  const content = STATUS_CONTENT[status];
  const Icon = content.icon;

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Icon className={`mx-auto ${content.iconClass}`} size={40} />
        <h1 className="mt-4 font-display text-2xl font-black">{content.title}</h1>
        <p className="mt-3 text-ink/70">{content.body}</p>
      </motion.div>
    </main>
  );
}