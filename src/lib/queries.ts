import { supabase } from '@/lib/supabase';
import type {
  Program,
  Track,
  Cohort,
  PricingPackage,
  ChampionshipSettings,
  AiCompetitionSettings,
} from '@/lib/types';

export type TrackWithData = Track & {
  cohorts: Cohort[];
  pricing: PricingPackage[];
};

export async function getProgramWithTracks(
  slug: string
): Promise<{ program: Program; tracks: TrackWithData[] } | null> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      program:programs!inner(*),
      cohorts(*),
      pricing_packages(*)
    `)
    .eq('program.slug', slug);

  if (error) {
    console.error('getProgramWithTracks error', error);
    return null;
  }
  if (!data || data.length === 0) {
    return null;
  }

  const program = data[0].program as Program;

  const tracks: TrackWithData[] = data.map((row) => ({
    id: row.id,
    program_id: row.program_id,
    name: row.name,
    age_min: row.age_min,
    age_max: row.age_max,
    big_idea: row.big_idea,
    final_outcome: row.final_outcome,
    cohorts: (row.cohorts as Cohort[]).filter((c) => c.status === 'open'),
    pricing: (row.pricing_packages as PricingPackage[]).sort(
      (a, b) => a.class_count - b.class_count
    ),
  }));

  return { program, tracks };
}

export async function getLatestChampionshipSettings(): Promise<ChampionshipSettings | null> {
  const { data, error } = await supabase
    .from('championship_settings')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('getLatestChampionshipSettings error', error);
    return null;
  }
  return data;
}

// AI/Coding competition settings mirror the championship settings, but
// stored separately since it's a distinct event with its own timeline.
export async function getLatestAiCompetitionSettings(): Promise<AiCompetitionSettings | null> {
  const { data, error } = await supabase
    .from('ai_competition_settings')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('getLatestAiCompetitionSettings error', error);
    return null;
  }
  return data;
}