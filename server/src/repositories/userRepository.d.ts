import { DatabaseSync } from 'node:sqlite';
import type { User, UserRole } from '@shared';
export interface CreateUserData {
    id?: string;
    email: string;
    password_hash: string;
    display_name: string;
    avatar_url?: string | null;
    role?: UserRole;
    bio?: string | null;
    preferred_region_id?: string | null;
}
export declare class UserRepository {
    private db;
    constructor(customDb?: DatabaseSync);
    findById(id: string): User | null;
    findByEmail(email: string): User | null;
    create(data: CreateUserData): User;
    update(id: string, fields: Partial<User>): User | null;
    private mapRowToUser;
}
export declare const userRepository: UserRepository;
