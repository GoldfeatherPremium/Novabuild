import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderKanban, FileText, ArrowLeft, MessageSquareText, NotebookPen } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getWorkspaceId } from "@/lib/app-data";
import { createClient } from "@/lib/supabase/server";
import ProjectDetailClient, { type Doc } from "@/components/app/ProjectDetailClient";
import StatusBadge from "@/components/app/StatusBadge";
import EmptyState from "@/components/app/EmptyState";
import { timeAgo } from "@/lib/utils";

function unnest<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") return [value as T];
  return [];
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const workspaceId = await getWorkspaceId(user.id);
  const supabase = createClient();

  const { data: project } = await supabase
    .from("research_projects")
    .select("id, name, description, archived, created_at, workspace_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!project) notFound();

  const { data: docRows } = await supabase
    .from("project_documents")
    .select("documents(id, title, file_type, status, created_at)")
    .eq("project_id", params.id);
  const docs = (docRows ?? []).flatMap((r) => unnest<Doc>(r.documents));

  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, pinned, updated_at")
    .eq("project_id", params.id)
    .order("updated_at", { ascending: false })
    .limit(6);

  const { data: convos } = await supabase
    .from("conversations")
    .select("id, title, last_message_at")
    .eq("workspace_id", workspaceId ?? "")
    .eq("archived", false)
    .order("last_message_at", { ascending: false })
    .limit(6);

  const { data: availableRows } = await supabase
    .from("documents")
    .select("id, title, file_type, status")
    .eq("workspace_id", workspaceId ?? "")
    .limit(300);
  const availableDocs: Doc[] = availableRows ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/projects" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>
      </div>

      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-lavender/25 bg-lavender/10">
              <FolderKanban className="h-6.5 w-6.5 text-lavender" />
            </span>
            <div>
              <h1 className="font-serif text-[26px] leading-tight text-ink">{project.name}</h1>
              {project.description && <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">{project.description}</p>}
              <p className="mt-2 text-[12.5px] text-muted">Created {timeAgo(project.created_at)}</p>
            </div>
          </div>
          <ProjectDetailClient
            projectId={project.id}
            initialName={project.name}
            initialDescription={project.description}
            initialArchived={project.archived}
            docs={docs}
            availableDocs={availableDocs}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-ink">
            <FileText className="h-4 w-4 text-violet-soft" /> Documents · {docs.length}
          </h2>
          {docs.length === 0 ? (
            <EmptyState icon={FileText} title="No documents yet" description="Attach documents from your library to this project." />
          ) : (
            <ul className="flex flex-col divide-y divide-white/[0.05]">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <Link href={`/app/documents/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                      <FileText className="h-4 w-4 text-muted" />
                    </span>
                    <span className="truncate text-[13.5px] font-medium text-ink hover:text-violet-soft">{d.title}</span>
                  </Link>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                <NotebookPen className="h-4 w-4 text-emerald-300" /> Notes
              </h2>
              <Link href="/app/notes" className="text-[13px] font-medium text-violet-soft hover:text-ink">All notes</Link>
            </div>
            {(notes ?? []).length === 0 ? (
              <p className="py-3 text-center text-[13px] text-muted">
                No notes in this project yet. <Link href="/app/notes?new=1" className="text-violet-soft">Create one</Link>.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.05]">
                {(notes ?? []).map((n) => (
                  <li key={n.id}>
                    <Link href={`/app/notes?n=${n.id}`} className="flex items-center gap-3 py-3">
                      <NotebookPen className="h-4 w-4 text-muted" />
                      <span className="truncate text-[13.5px] font-medium text-ink">{n.title}</span>
                      <span className="ml-auto text-[12px] text-muted">{timeAgo(n.updated_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                <MessageSquareText className="h-4 w-4 text-electric-bright" /> Workspace conversations
              </h2>
              <Link href="/app/chat" className="text-[13px] font-medium text-violet-soft hover:text-ink">Open chat</Link>
            </div>
            {(convos ?? []).length === 0 ? (
              <p className="py-3 text-center text-[13px] text-muted">
                No conversations yet. <Link href="/app/chat" className="text-violet-soft">Start one</Link>.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.05]">
                {(convos ?? []).slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link href={`/app/chat?c=${c.id}`} className="flex items-center justify-between gap-3 py-3">
                      <span className="truncate text-[13.5px] font-medium text-ink">{c.title}</span>
                      <span className="shrink-0 text-[12px] text-muted">{timeAgo(c.last_message_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
