import { randomUUID } from "node:crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { publicConfig } from "@/lib/env-public";
import { isSupabaseConfigured } from "@/lib/env";

const BUCKET = "documents";

/**
 * Storage helpers. All document files live in the private "documents" bucket.
 * Access is always via short-lived signed URLs generated server-side — never
 * public URLs. Path scheme: {userId}/{docId}/{sanitized-filename}
 */

export function serviceClient() {
  if (!isSupabaseConfigured) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  }
  return createServiceClient(publicConfig.supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function makeStoragePath(userId: string, filename: string): string {
  const safe = filename.replace(/[^\w.\-]/g, "_").slice(-80);
  return `${userId}/${randomUUID()}/${safe}`;
}

export async function createSignedUploadUrl(userId: string, filename: string, contentType: string) {
  const supabase = serviceClient();
  const path = makeStoragePath(userId, filename);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, {
    contentType,
  });
  if (error) throw new Error(error.message);
  return { path, url: data.signedUrl, token: data.token };
}

export async function createSignedDownloadUrl(path: string) {
  const supabase = serviceClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function downloadObject(path: string) {
  const supabase = serviceClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "Download failed");
  return data;
}

export async function objectExists(path: string) {
  const supabase = serviceClient();
  const { data, error } = await supabase.storage.from(BUCKET).list(path.split("/").slice(0, 2).join("/"), {
    search: path.split("/").pop(),
  });
  if (error) return false;
  return (data ?? []).some((f) => `${path.split("/").slice(0, 2).join("/")}/${f.name}` === path);
}

export async function removeObject(path: string) {
  const supabase = serviceClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
