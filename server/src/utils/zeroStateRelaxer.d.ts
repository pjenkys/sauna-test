/**
 * Intelligent Zero-State Filter Relaxation Engine
 * Analyzes active query filters and provides targeted recommendations
 * for broadening search criteria when a query yields zero results.
 */
export declare function suggestRelaxations(activeFilters: Record<string, any>, resultCount: number): string[];
