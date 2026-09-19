/**
 * Hashes a plaintext password asynchronously using bcrypt.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compares a plaintext password with a bcrypt hash asynchronously.
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Hashes a plaintext password synchronously using bcrypt.
 */
export declare function hashPasswordSync(password: string): string;
/**
 * Compares a plaintext password with a bcrypt hash synchronously.
 */
export declare function comparePasswordSync(password: string, hash: string): boolean;
