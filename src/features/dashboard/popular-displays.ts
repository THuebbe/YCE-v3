// Server only: the Elite "Popular displays" dashboard card (PRODUCT.md
// "Future features": count by occasion and theme, never by letter -
// letters would always win).
import { supabase } from '@/lib/db/supabase-client';
import { eventMessages } from '@/features/booking/display-options';
import type { PopularDisplays, PopularItem } from './types';


const PRESETS = new Set(eventMessages.map(m => m.message));
const top = (counts: Map<string, number>, n: number): PopularItem[] =>
  [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, n);

/** Booked (not cancelled) displays from the last 12 months, top 5 of each */
export async function getPopularDisplays(agencyId: string): Promise<PopularDisplays> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const { data, error } = await supabase
    .from('orders')
    .select('message, theme, display_config')
    .eq('agency_id', agencyId)
    .neq('status', 'cancelled')
    .gte('created_at', since.toISOString());
  if (error) {
    console.error('getPopularDisplays failed:', agencyId, error.message);
    return { occasions: [], themes: [] };
  }

  const occasions = new Map<string, number>();
  const themes = new Map<string, number>();
  for (const order of data ?? []) {
    const config = (order.display_config ?? {}) as { eventMessage?: string; characterTheme?: string };
    // Orders from before display_config only count if their message is a preset
    const occasion = config.eventMessage ?? (PRESETS.has(order.message) ? order.message : null);
    if (occasion) {
      const label = occasion === 'Custom Message' ? 'Custom message' : occasion;
      occasions.set(label, (occasions.get(label) ?? 0) + 1);
    }
    const theme = config.characterTheme || order.theme;
    if (theme) themes.set(theme, (themes.get(theme) ?? 0) + 1);
  }
  return { occasions: top(occasions, 5), themes: top(themes, 5) };
}
