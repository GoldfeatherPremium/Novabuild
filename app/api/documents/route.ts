import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { objectExists } from "@/lib/documents/storage";
import { validateFile } from "@/lib/documents/validate";
import { processDocument } from "@/lib/processing/pipeline";
import { createNotification } from "@/lib/notifications";

const STATUS_MAP: Record<string, string> = {
  uploading: "uploading",
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
};

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);
  const workspaceId = memberships?.[0]?.workspace_id;
  if (!workspaceId) return NextResponse.json({ documents: [] });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.toLowerCase();
  const sort = url.searchParams.get("sort") ?? "newest";

  let query = supabase
    .from("documents")
    .select("id, title, original_filename, file_type, file_size, status, created_at, updated_at, pinned, page_count, summary_available")
    .eq("workspace_id", workspaceId);

  if (status && STATUS_MAP[status]) query = query.eq("status", STATUS_MAP[status]);
  if (q) query = query.ilike("title", `%${q}%`);

  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name":
      query = query.order("title", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

/**
 * Finalize a document after the client uploaded the file via the presigned
 * URL. Creates the DB record + job, then kicks off async processing.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    path?: string;
    title?: string;
    originalFilename?: string;
    fileType?: string;
    fileSize?: number;
    projectId?: string | null;
  };

  if (!body.path || !body.originalFilename || !body.fileType) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const title = (body.title ?? body.originalFilename).replace(/\.[^.]+$/, "").slice(0, 200);

  const validation = validateFile({ name: body.originalFilename, size: body.fileSize ?? 0 });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  // Confirm the object actually exists in storage.
  const exists = await objectExists(body.path);
  if (!exists) return NextResponse.json({ error: "File not found in storage" }, { status: 400 });

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);
  const workspaceId = memberships?.[0]?.workspace_id;
  if (!workspaceId) return NextResponse.json({ error: "no workspace" }, { status: 400 });

  // Duplicate detection: same original filename + size in the workspace.
  const { data: dup } = await supabase
    .from("documents")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("original_filename", body.originalFilename)
    .eq("file_size", body.fileSize ?? 0)
    .limit(1);

  if (dup && dup.length > 0) {
    return NextResponse.json({ error: "DUPLICATE_DOCUMENT" }, { status: 409 });
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspaceId,
      owner_id: user.id,
      project_id: body.projectId ?? null,
      title,
      original_filename: body.originalFilename,
      file_type: body.fileType,
      file_size: body.fileSize ?? 0,
      storage_path: body.path,
      status: "queued",
    })
    .select()
    .single();

  if (docError) return NextResponse.json({ error: docError.message }, { status: 500 });

  const { error: jobError } = await supabase.from("document_processing_jobs").insert({
    document_id: doc.id,
    status: "queued",
  });
  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });

  // Fire-and-forget processing (no request held open). Status is polled.
  void processDocument(doc.id).catch(() => {});

  await createNotification({
    userId: user.id,
    type: "upload_success",
    title: "Upload started",
    body: `“${title}” was uploaded and queued for processing.`,
    data: { documentId: doc.id },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
