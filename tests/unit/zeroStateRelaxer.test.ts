import { describe, it, expect } from 'vitest';
import { suggestRelaxations } from '../setup';

describe('Unit: Intelligent Zero-State Filter Relaxation Engine', () => {
  it('returns empty array when search results are found (> 0 matches)', () => {
    const suggestions = suggestRelaxations({ cooling: 'plunge_pool' }, 5);
    expect(suggestions).toEqual([]);
  });

  it('BND-01: suggests relaxing cooling and region for contradictory zero-state queries', () => {
    const filters = {
      cooling: 'natural_water',
      region_id: 'cz-lib',
    };
    const suggestions = suggestRelaxations(filters, 0);

    expect(suggestions).toContain('remove_cooling');
    expect(suggestions).toContain('expand_region');
  });

  it('suggests MultiSport relaxation when strict benefit type yields 0 results', () => {
    const filters = {
      benefit_type: 'free_unlimited',
      region_id: 'cz-vys',
    };
    const suggestions = suggestRelaxations(filters, 0);

    expect(suggestions).toContain('relax_multisport');
    expect(suggestions).toContain('expand_region');
  });

  it('suggests sauna type and nudity policy relaxation when specialized filters yield 0 results', () => {
    const filters = {
      sauna_type: 'smoke_sauna',
      nudity_policy: 'strict_nudist',
    };
    const suggestions = suggestRelaxations(filters, 0);

    expect(suggestions).toContain('remove_sauna_type');
    expect(suggestions).toContain('relax_nudity_policy');
  });

  it('provides generic fallback relaxation suggestion when no specific filters match', () => {
    const suggestions = suggestRelaxations({}, 0);
    expect(suggestions).toEqual(['expand_search_criteria']);
  });
});
