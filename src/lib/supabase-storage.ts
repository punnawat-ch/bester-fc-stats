import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Generic, framework-agnostic Supabase Storage helper.
 * Server-only: uses the service secret key (never expose to the client).
 * Parameterized by bucket so both players (player-photos) and club
 * (club-assets) flows reuse the same primitives.
 */

export const BUCKETS = {
  players: "player-photos",
  club: "club-assets",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export type SignedUpload = {
  path: string;
  token: string;
  signedUrl: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_SECRET_KEY = process.env.SUPABASE_SERVICE_SECRET_KEY;

let cachedClient: SupabaseClient | undefined;

function getStorageClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  if (SUPABASE_URL == null || SERVICE_SECRET_KEY == null) {
    throw new Error(
      "Supabase storage is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_SECRET_KEY.",
    );
  }

  cachedClient = createClient(SUPABASE_URL, SERVICE_SECRET_KEY, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

/**
 * Create a signed upload URL so the client can PUT a file directly into
 * Storage (avoids Server Action body limits).
 */
export async function createSignedUpload(
  bucket: BucketName,
  path: string,
): Promise<SignedUpload> {
  const storage = getStorageClient().storage.from(bucket);
  const { data, error } = await storage.createSignedUploadUrl(path);

  if (error != null) throw error;

  return { path: data.path, token: data.token, signedUrl: data.signedUrl };
}

/**
 * Upload bytes to `path` in the given bucket (server-only, service role).
 * Used by the Server-Action upload flow (client sends the processed image as a
 * FormData `File`; the action forwards the bytes here). `upsert` keeps the call
 * idempotent when a path is reused.
 */
export async function uploadObject(
  bucket: BucketName,
  path: string,
  bytes: ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const storage = getStorageClient().storage.from(bucket);
  const { error } = await storage.upload(path, bytes, {
    contentType,
    upsert: true,
  });

  if (error != null) throw error;
}

/** Resolve the public URL for an object path in the given bucket. */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const storage = getStorageClient().storage.from(bucket);
  return storage.getPublicUrl(path).data.publicUrl;
}

/** Remove an object from the given bucket (used when replacing/deleting). */
export async function removeObject(
  bucket: BucketName,
  path: string,
): Promise<void> {
  const storage = getStorageClient().storage.from(bucket);
  const { error } = await storage.remove([path]);

  if (error != null) throw error;
}
