import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { getCohortForRegistration, type CohortForRegistration } from '@/lib/queries';
import { openPaystackCheckout } from '@/lib/paystack';
import type { PricingPackage } from '@/lib/types';

const DELIVERY_LABEL = { in_person: 'In-Person', online: 'Online' };
const CONTACT_OPTIONS = ['WhatsApp', 'Email', 'Phone Call'];
const CURRENCY_MAP: Record<'KSH' | 'USD', 'KES' | 'USD'> = { KSH: 'KES', USD: 'USD' };

// Online packages are priced in USD. Kenya-based registrants pay the KES
// equivalent instead, since Paystack only offers M-Pesa for KES-denominated
// transactions — everyone else (and all in-person registrations, which are
// already priced in KSH) pays via card as before.
const USD_TO_KES_RATE = 130;

type Step = 'form' | 'payment' | 'verifying' | 'closed' | 'failed';

export default function Register() {
  const navigate = useNavigate();
  const { cohortId } = useParams<{ cohortId: string }>();
  const [searchParams] = useSearchParams();
  const cycleParam = searchParams.get('cycle');
  const datesParam = searchParams.get('dates');

  const [cohort, setCohort] = useState<CohortForRegistration | null>(null);
  const [pricing, setPricing] = useState<PricingPackage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [country, setCountry] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [preferredContact, setPreferredContact] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');

  const isKenya = country.trim().toLowerCase() === 'kenya';
  const selectedPackage = pricing.find((p) => p.id === selectedPackageId);

  // Derived checkout values — the only thing that changes for online + Kenya.
  const payingViaMpesa =
    cohort?.delivery === 'online' && isKenya && selectedPackage?.currency === 'USD';
  const checkoutAmount = selectedPackage
    ? payingViaMpesa
      ? Math.round(selectedPackage.price * USD_TO_KES_RATE)
      : selectedPackage.price
    : 0;
  const checkoutCurrency: 'KES' | 'USD' = selectedPackage
    ? payingViaMpesa
      ? 'KES'
      : CURRENCY_MAP[selectedPackage.currency]
    : 'USD';

  useEffect(() => {
    if (!cohortId) return;
    getCohortForRegistration(cohortId).then((result) => {
      if (!result) {
        setLoadError("Couldn't load this class. The link may be out of date.");
        return;
      }
      setCohort(result.cohort);
      setPricing(result.pricing);
      if (result.pricing.length > 0) {
        setSelectedPackageId(result.pricing[result.pricing.length - 1].id);
      }
      if (result.cohort.delivery === 'in_person') {
        setCountry('Kenya');
      }
    });
  }, [cohortId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cohort || !selectedPackageId) return;
    setSubmitting(true);
    setSubmitError(null);

    const isRolling = cohort.cycle_length !== null;
    const term_label = isRolling
      ? cycleParam
        ? `Cycle ${cycleParam}: ${datesParam?.split(',')[0]} – ${datesParam?.split(',').slice(-1)[0]}`
        : cohort.term_label
      : cohort.term_label;

    const newId = crypto.randomUUID();

    const { error } = await supabase.from('registrations').insert({
      id: newId,
      cohort_id: cohort.id,
      package_id: selectedPackageId,
      student_name: studentName,
      student_age: Number(studentAge),
      school_name: schoolName,
      country,
      parent_name: parentName,
      parent_email: parentEmail,
      parent_phone: whatsappNumber,
      preferred_contact: preferredContact,
      payment_status: 'pending',
      term_label,
      cycle_number: cycleParam ? Number(cycleParam) : null,
      session_dates: datesParam ? datesParam.split(',') : null,
    });

    setSubmitting(false);

    if (error) {
      console.error('registration insert error', error);
      setSubmitError('Something went wrong saving your registration. Please try again.');
      return;
    }

    setRegistrationId(newId);
    setStep('payment');
  }

  async function reconcilePayment(reference: string) {
    setStep('verifying');
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { reference, registrationId },
    });

    if (error || !data) {
      console.error('verification error', error);
      setStep('payment');
      setSubmitError('Could not confirm payment status. Please try again or contact us.');
      return;
    }

    if (data.status === 'paid') {
      navigate(`/thank-you/${registrationId}`);
    } else if (data.status === 'cancelled') {
      setStep('closed');
    } else {
      setStep('failed');
    }
  }

  function handlePayNow() {
    if (!selectedPackage || !registrationId) return;
    const paystackReference = `reg_${registrationId}_${Date.now()}`;

    openPaystackCheckout({
      email: parentEmail,
      amount: checkoutAmount,
      currency: checkoutCurrency,
      reference: paystackReference,
      onSuccess: (reference) => reconcilePayment(reference),
      onClose: () => reconcilePayment(paystackReference),
      onError: () => reconcilePayment(paystackReference),
    });
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-ink/70">{loadError}</p>
      </main>
    );
  }

  if (!cohort) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-ink/50">Loading…</p>
      </main>
    );
  }

  if (step === 'verifying') {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <Loader2 className="mx-auto animate-spin text-ink/50" size={32} />
        <p className="mt-4 text-sm text-ink/60">Confirming your payment…</p>
      </main>
    );
  }

  if (step === 'payment' || step === 'closed' || step === 'failed') {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-black">
            {step === 'failed' ? "Payment didn't go through" : 'Complete your payment'}
          </h1>
          <p className="mt-3 text-ink/70">
            {cohort.track.name} — {selectedPackage?.class_count}-Class Package
          </p>
          <p className="mt-1 font-display text-3xl font-black">
            {checkoutCurrency === 'KES' ? 'KSH ' : '$'}
            {checkoutAmount.toLocaleString()}
          </p>
          {payingViaMpesa && (
            <p className="mt-1 text-xs text-ink/50">
              Converted from ${selectedPackage?.price.toLocaleString()} at 1 USD = KSH{' '}
              {USD_TO_KES_RATE} for M-Pesa payment.
            </p>
          )}

          {step === 'closed' && (
            <p className="mt-4 text-sm text-ink/60">
              Checkout was closed before completing payment. Your
              registration is saved — you can pay whenever you're ready.
            </p>
          )}

          {step === 'failed' && (
            <p className="mt-4 text-sm text-ink/60">
              The payment attempt didn't succeed — this can happen with
              insufficient funds or a declined card. Your registration is
              still saved, so it's safe to try again.
            </p>
          )}

          {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

          <button
            onClick={handlePayNow}
            className="mt-6 w-full rounded-full bg-marigold px-6 py-3 text-sm font-bold uppercase tracking-wide text-cream transition-colors hover:bg-marigold-dark"
          >
            {step === 'failed' ? 'Try Again' : 'Pay Now'}
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">
          {cohort.track.name} · {DELIVERY_LABEL[cohort.delivery]}
        </p>
        <h1 className="mt-2 font-display text-3xl font-black">Register for Training</h1>
        <p className="mt-2 text-sm text-ink/70">
          {cohort.day_of_week}s, {cohort.start_time}–{cohort.end_time}
        </p>
      </motion.div>

      <Card className="mt-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink/50">
              Choose a package
            </p>
            <div className="flex flex-wrap gap-2">
              {pricing.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedPackageId === pkg.id
                      ? 'border-marigold bg-marigold/10 text-ink'
                      : 'border-ink/15 text-ink/70 hover:border-ink/30'
                  }`}
                >
                  {pkg.class_count}-Class — {pkg.currency === 'KSH' ? 'KSH ' : '$'}
                  {pkg.price.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Student Name
              <input
                required
                placeholder="Student full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Student Age
              <input
                required
                type="number"
                placeholder="Age"
                min={cohort.track.age_min}
                max={cohort.track.age_max}
                value={studentAge}
                onChange={(e) => setStudentAge(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              School Name
              <input
                required
                placeholder="School name"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Country
              {cohort.delivery === 'in_person' ? (
                <input
                  disabled
                  value="Kenya"
                  className="rounded-lg border border-ink/15 bg-ink/5 px-3 py-2 text-ink/60"
                />
              ) : (
                <input
                  required
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
                />
              )}
              {isKenya && (
                <span className="text-xs text-marigold-dark">
                  M-Pesa payment option will be available at checkout
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Parent/Guardian Name
              <input
                required
                placeholder="Parent full name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Parent Email
              <input
                required
                type="email"
                placeholder="parent@email.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              WhatsApp Number
              <input
                required
                type="tel"
                placeholder="+254..."
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Preferred Contact
              <select
                required
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
              >
                <option value="" disabled>
                  Select one
                </option>
                {CONTACT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-marigold px-6 py-3 text-sm font-bold uppercase tracking-wide text-cream transition-colors hover:bg-marigold-dark disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Continue to Payment'}
          </button>
        </form>
      </Card>
    </main>
  );
}