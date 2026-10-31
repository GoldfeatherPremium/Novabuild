"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Archive, FileText, ArrowRight } from "lucide-react";
import ProjectCreateModal from "@/components/app/ProjectCreateModal";
import EmptyState from "@/components/app/EmptyState";
import { timeAgo } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/projects");
      const body = await res.json().catch(() => ({}));
      const list = (body.projects ?? []) as Project[];
      setProjects(list);
      const c: Record<string, number> = {};
      await Promise.all(
        list.map(async (p) => {
          const r = await fetch(`/api/projects/${p.id}`);
          const b = await r.json().catch(() => ({}));
          c[p.id] = (b.documents ?? []).length;
        })
      );
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const visible = projects.filter((p) => (showArchived ? p.archived : !p.archived));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-ink">Research projects</h1>
          <p className="mt-1 text-[13.5px] text-muted">Organize documents, conversations and notes around a research question.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary h-11 px-6 text-[14px]">
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${!showArchived ? "border border-violet/40 bg-violet/15 text-violet-soft" : "border border-white/10 text-muted hover:text-ink"}`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${showArchived ? "border border-violet/40 bg-violet/15 text-violet-soft" : "border border-white/10 text-muted hover:text-ink"}`}
        >
          <Archive className="h-3.5 w-3.5" /> Archived
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel h-36 animate-pulse p-5" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={showArchived ? "No archived projects" : "No projects yet"}
          description="Create a project to group related documents, AI conversations and notes."
          action={!showArchived ? <button type="button" onClick={() => setModalOpen(true)} className="btn-primary px-6 py-3 text-[14px]"><Plus className="h-4 w-4" /> Create a project</button> : undefined}
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <Link key={p.id} href={`/app/projects/${p.id}`} className="panel group flex flex-col p-5 card-hover">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-lavender/25 bg-lavender/10">
                  <FolderKanban className="h-5 w-5 text-lavender" />
                </span>
                {p.archived && <Archive className="h-4 w-4 text-muted" />}
              </div>
              <h2 className="mt-4 text-[15.5px] font-semibold text-ink transition-colors group-hover:text-lavender">{p.name}</h2>
              {p.description && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{p.description}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
                  <FileText className="h-3.5 w-3.5" /> {counts[p.id] ?? 0} documents
                </span>
                <span className="flex items-center gap-1 text-[12px] text-muted">
                  {timeAgo(p.created_at)} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <ProjectCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
