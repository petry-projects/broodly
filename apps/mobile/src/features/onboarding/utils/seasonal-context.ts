import type { SeasonalContext } from '../../../store/onboarding-store';

const SOUTHERN_HEMISPHERE_KEYWORDS = [
  'australia', 'melbourne', 'sydney', 'brisbane', 'perth', 'adelaide',
  'new zealand', 'auckland', 'wellington',
  'south africa', 'cape town', 'johannesburg',
  'argentina', 'buenos aires', 'chile', 'santiago',
  'brazil', 'são paulo', 'rio',
];

/**
 * Determines hemisphere from region string and computes seasonal context.
 */
export function resolveSeasonalContext(region: string, date: Date): SeasonalContext {
  const lower = region.toLowerCase();
  const isSouthern = SOUTHERN_HEMISPHERE_KEYWORDS.some((kw) => lower.includes(kw));
  const hemisphere = isSouthern ? 'southern' : 'northern';

  const month = date.getMonth(); // 0-indexed
  const season = getSeasonForMonth(month, hemisphere);
  const isMidSeason = season === 'summer' || season === 'fall';

  return { hemisphere, season, isMidSeason };
}

function getSeasonForMonth(
  month: number,
  hemisphere: 'northern' | 'southern'
): 'spring' | 'summer' | 'fall' | 'winter' {
  // Northern: Mar-May spring, Jun-Aug summer, Sep-Nov fall, Dec-Feb winter
  const northernSeasons: Array<'winter' | 'spring' | 'summer' | 'fall'> = [
    'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
    'summer', 'summer', 'fall', 'fall', 'fall', 'winter',
  ];
  const season = northernSeasons[month];
  if (hemisphere === 'northern') return season;

  // Southern hemisphere is 6 months offset
  const flip: Record<string, 'spring' | 'summer' | 'fall' | 'winter'> = {
    spring: 'fall',
    summer: 'winter',
    fall: 'spring',
    winter: 'summer',
  };
  return flip[season];
}

/**
 * Determines if the current date is mid-season for the given region.
 */
export function isMidSeason(region: string, date: Date): boolean {
  const ctx = resolveSeasonalContext(region, date);
  return ctx.isMidSeason;
}
