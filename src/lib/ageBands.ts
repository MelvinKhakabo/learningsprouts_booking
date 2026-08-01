export type AgeBandId = 'junior' | 'middle' | 'senior';

export type AgeBand = {
  id: AgeBandId;
  label: string;
  ageRange: string;
  bg: string;    // Tailwind bg class
  text: string;  // Tailwind text class
};

export const AGE_BANDS: Record<AgeBandId, AgeBand> = {
  junior: { id: 'junior', label: 'Junior', ageRange: '7–11', bg: 'bg-peach', text: 'text-ink' },
  middle: { id: 'middle', label: 'Middle', ageRange: '12–15', bg: 'bg-lavender', text: 'text-ink' },
  senior: { id: 'senior', label: 'Senior', ageRange: '16–18', bg: 'bg-marigold-light', text: 'text-ink' },
};

// Maps a track's age range straight from Supabase to the right band.
export function bandForAges(_ageMin: number, ageMax: number): AgeBand {
  if (ageMax <= 11) return AGE_BANDS.junior;
  if (ageMax <= 15) return AGE_BANDS.middle;
  return AGE_BANDS.senior;
}