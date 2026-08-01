import type { AgeBandId } from '@/lib/ageBands';
import { AGE_BANDS } from '@/lib/ageBands';

export default function AgeBadge({ bandId }: { bandId: AgeBandId }) {
  const band = AGE_BANDS[bandId];
  return (
    <span
      className={`${band.bg} ${band.text} inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}
    >
      {band.label}
      <span className="font-mono font-normal normal-case tracking-normal opacity-70">
        {band.ageRange}
      </span>
    </span>
  );
}