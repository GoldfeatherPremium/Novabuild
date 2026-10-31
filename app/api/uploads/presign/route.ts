import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateFile } from "@/lib/documents/validate";
import { createSignedUploadUrl } from "@/lib/documents/storage";
import { isSupabaseConfigured } from "@/lib/env";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { name?: string; size?: number; contentType?: string };
  const name = body.name ?? "";
  const size = body.size ?? 0;
  const contentType = body.contentType ?? "application/octet-stream";

  const validation = validateFile({ name, size });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const { path, url, token } = await createSignedUploadUrl(user.id, name, contentType);
    return NextResponse.json({ path, url, token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "storage unavailable" },
      { status: 500 }
    );
  }
}
