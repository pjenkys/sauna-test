/**
 * Intelligent Zero-State Filter Relaxation Engine
 * Analyzes active query filters and provides targeted recommendations
 * for broadening search criteria when a query yields zero results.
 */
export function suggestRelaxations(
  activeFilters: Record<string, any>,
  resultCount: number
): string[] {
  if (resultCount > 0) return [];

  const suggestions: string[] = [];

  if (activeFilters.cooling) {
    suggestions.push('remove_cooling');
  }
  if (activeFilters.region_id || activeFilters.city_id) {
    suggestions.push('expand_region');
  }
  if (activeFilters.benefit_type) {
    suggestions.push('relax_multisport');
  }
  if (activeFilters.sauna_type) {
    suggestions.push('remove_sauna_type');
  }
  if (activeFilters.nudity_policy) {
    suggestions.push('relax_nudity_policy');
  }

  if (suggestions.length === 0) {
    suggestions.push('expand_search_criteria');
  }

  return suggestions;
}
