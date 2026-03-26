export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border-soft)] bg-white/70">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Learning Sprouts Office Hours
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Guided learning, one session at a time.
        </p>

        <div className="mt-5 flex flex-col items-center justify-center gap-2 text-sm sm:flex-row sm:gap-6 sm:text-base">
          <a
            href="https://learningsprouts.school"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand-primary)] font-semibold hover:underline"
          >
            learningsprouts.school
          </a>

          <a
            href="mailto:ask@learningsprouts.school"
            className="text-[var(--brand-primary)] font-semibold hover:underline"
          >
            ask@learningsprouts.school
          </a>
        </div>

        <p className="mt-6 text-xs text-[var(--text-muted)] sm:text-sm">
          © 2026 Learning Sprouts. All rights reserved.
        </p>
      </div>
    </footer>
  );
}