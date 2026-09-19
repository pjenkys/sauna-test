import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password asynchronously using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plaintext password with a bcrypt hash asynchronously.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hashes a plaintext password synchronously using bcrypt.
 */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Compares a plaintext password with a bcrypt hash synchronously.
 */
export function comparePasswordSync(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
