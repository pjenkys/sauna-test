import { DatabaseSync } from 'node:sqlite';
import type { SaunaCeremony, CeremonyCategoryCode } from '@shared';
export interface FindCeremoniesOptions {
    venue_id?: string;
    category?: CeremonyCategoryCode;
    day_of_week?: number;
    limit?: number;
    offset?: number;
}
export declare class CeremonyRepository {
    private db;
    constructor(customDb?: DatabaseSync);
    findUpcoming(options?: FindCeremoniesOptions): SaunaCeremony[];
    findById(id: string): SaunaCeremony | null;
    create(ceremony: Partial<SaunaCeremony>): SaunaCeremony;
    delete(id: string): boolean;
    private mapRowToCeremony;
}
export declare const ceremonyRepository: CeremonyRepository;
