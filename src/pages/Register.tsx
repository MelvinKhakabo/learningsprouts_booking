import { useParams } from 'react-router-dom';

export default function Register() {
  const { cohortId } = useParams<{ cohortId: string }>();

  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Register</h1>
      <p className="text-neutral-600">
        Placeholder — registration form + Paystack checkout for cohort{' '}
        <code className="text-sm bg-neutral-100 px-1.5 py-0.5 rounded">
          {cohortId}
        </code>{' '}
        comes in Phase 4.
      </p>
    </main>
  );
}
