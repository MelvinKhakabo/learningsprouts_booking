export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-black">Learning Sprouts</p>
            <p className="mt-1 text-sm text-cream/70">
              Nairobi's Future Skills Hub
            </p>
          </div>

          <div className="text-sm text-cream/80">
            <p className="font-semibold text-cream">Contact Us</p>
            <p className="mt-1">ask@learningsprouts.school</p>
            <p>+254 719 218 992</p>
          </div>

          <div className="text-sm text-cream/80">
            <p className="font-semibold text-cream">Address</p>
            <p className="mt-1">Loresho Shopping Centre, Loresho Ridge</p>
          </div>
        </div>

        <p className="mt-10 font-mono text-xs text-cream/50">
          © {new Date().getFullYear()} Learning Sprouts. All rights reserved.
        </p>
      </div>
    </footer>
  );
}