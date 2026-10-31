import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Knowledge graph. Only real relationships derived from actual stored data
 * are returned:
 *  - documents ↔ documents that share tags
 *  - entities extracted (only when present) with their relationships
 * If there is insufficient data, we return an empty graph and the UI shows an
 * appropriate empty state — never fabricated relationships.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspace_id");

  if (workspaceId) {
    const { data: entities } = await supabase
      .from("knowledge_entities")
      .select("id, label, type, meta, doc_count")
      .eq("workspace_id", workspaceId)
      .limit(200);
    const { data: relationships } = await supabase
      .from("knowledge_relationships")
      .select("id, source_id, target_id, relation, weight")
      .eq("workspace_id", workspaceId)
      .limit(400);

    if ((entities ?? []).length > 0 || (relationships ?? []).length > 0) {
      return NextResponse.json({ nodes: entities ?? [], edges: relationships ?? [] });
    }
  }

  // Derive relationships from the user's own data.
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);
  const wid = workspaceId ?? memberships?.[0]?.workspace_id;
  if (!wid) return NextResponse.json({ nodes: [], edges: [] });

  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, file_type, created_at")
    .eq("workspace_id", wid)
    .limit(100);
  const { data: docsTags } = await supabase
    .from("document_tags")
    .select("document_id, tags(id, name)")
    .limit(200);

  const nodes = (docs ?? []).map((d) => ({
    id: `doc:${d.id}`,
    label: d.title,
    type: "document",
    meta: { fileType: d.file_type },
    doc_count: 1,
  }));

  const edges: Array<Record<string, unknown>> = [];
  const byTag = new Map<string, string[]>();
  for (const dt of docsTags ?? []) {
    const tagId = (dt.tags as { id?: string } | null)?.id;
    if (!tagId) continue;
    const arr = byTag.get(tagId) ?? [];
    arr.push(dt.document_id);
    byTag.set(tagId, arr);
  }
  for (const grouped of Array.from(byTag.values())) {
    for (let i = 0; i < grouped.length; i++) {
      for (let j = i + 1; j < grouped.length; j++) {
        edges.push({
          id: `rel:${grouped[i]}:${grouped[j]}`,
          source_id: `doc:${grouped[i]}`,
          target_id: `doc:${grouped[j]}`,
          relation: "shares_tag",
          weight: 1,
        });
      }
    }
  }

  return NextResponse.json({ nodes, edges: edges.slice(0, 200) });
}
