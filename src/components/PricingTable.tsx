type PricingRow = {
  classCount: number;
  price: number;
  currency: 'KSH' | 'USD';
};

export default function PricingTable({ rows }: { rows: PricingRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {rows.map((row) => (
        <div
          key={row.classCount}
          className="rounded-2xl border border-ink/10 bg-white/50 p-5 text-center"
        >
          <p className="font-mono text-xs uppercase tracking-wide text-ink/60">
            {row.classCount}-Class Package
          </p>
          <p className="mt-2 font-display text-2xl font-black">
            {row.currency === 'KSH' ? 'KSH ' : '$'}
            {row.price.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}