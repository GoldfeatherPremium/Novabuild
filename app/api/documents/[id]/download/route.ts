import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSignedDownloadUrl } from "@/lib/documents/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, owner_id, workspace_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Ownership checked by RLS on the select above; signed URL is short-lived.
  const url = await createSignedDownloadUrl(doc.storage_path).catch(() => null);
  if (!url) return NextResponse.json({ error: "download unavailable" }, { status: 500 });
  return NextResponse.redirect(url);
}
