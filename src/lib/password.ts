import "server-only";
import * as argon2 from "argon2";

/**
 * Hash a plaintext password with argon2.
 * Matches how `prisma/seed.ts` hashes the seeded admin password.
 */
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

/**
 * Verify a plaintext password against a stored argon2 hash.
 * Returns false instead of throwing when the hash is malformed.
 */
export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
