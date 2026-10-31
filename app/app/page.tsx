import Link from "next/link";
import {
  FileText,
  MessageSquareText,
  FolderKanban,
  NotebookPen,
  Sparkles,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  MessagesSquare,
  Clock,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getWorkspaceId, getAppData } from "@/lib/app-data";
import { getCreditBalance } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/app/EmptyState";
import StatusBadge from "@/components/app/StatusBadge";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = [
  { label: "Upload document", href: "/app/documents?upload=1", icon: FileText, tint: "text-violet-soft bg-violet/10 border-violet/25" },
  { label: "Start AI chat", href: "/app/chat", icon: MessageSquareText, tint: "text-electric-bright bg-electric/10 border-electric/25" },
  { label: "Create project", href: "/app/projects?new=1", icon: FolderKanban, tint: "text-lavender bg-lavender/10 border-lavender/25" },
  { label: "New note", href: "/app/notes?new=1", icon: NotebookPen, tint: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25" },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getAppData(user.id);
  const workspaceId = await getWorkspaceId(user.id);
  const credits = await getCreditBalance(user.id);
  const supabase = createClient();

  const [docsRes, convosRes, notesRes, projectsRes, usageRes] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, file_type, file_size, status, summary_available, created_at")
      .eq("workspace_id", workspaceId ?? "")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("conversations")
      .select("id, title, pinned, last_message_at")
      .eq("owner_id", user.id)
      .eq("archived", false)
      .order("last_message_at", { ascending: false })
      .limit(5),
    supabase
      .from("notes")
      .select("id, title, pinned, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("research_projects")
      .select("id, name, archived")
      .eq("owner_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("usage_records")
      .select("metric, units")
      .eq("user_id", user.id),
  ]);

  const docs = docsRes.data ?? [];
  const totalStorage = docs.reduce((acc, d) => acc + (d.file_size ?? 0), 0);
  const completedAnalyses = docs.filter((d) => d.summary_available).length;
  const aiQuestions = (usageRes.data ?? []).filter((u) => u.metric === "chat_question").reduce((a, u) => a + u.units, 0);
  const recentDocs = docs.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[13px] font-medium text-muted">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 font-serif text-[30px] leading-tight text-ink sm:text-[34px]">
            {greeting()}, <span className="text-gradient">{data.fullName.split(" ")[0]}</span>
            <span className="ml-2 align-middle text-[20px]">✨</span>
          </h1>
        </div>
        <Link href="/app/documents?upload=1" className="btn-primary h-11 px-6 text-[14px]">
          <FileText className="h-4 w-4" /> Upload a document
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total documents", value: docs.length, icon: FileText, hint: recentDocs.length > 0 ? "Recent uploads" : undefined },
          { label: "Completed analyses", value: completedAnalyses, icon: CheckCircle2, hint: "Summaries + insights" },
          { label: "AI questions asked", value: aiQuestions, icon: MessagesSquare, hint: "This month" },
          { label: "Storage used", value: formatBytes(totalStorage), icon: HardDrive, hint: `${Math.max(0, Math.round((totalStorage / credits.monthlyAllowance / 1024 / 1024 / 1024) * 100))}% of allowance` },
        ].map((s) => (
          <div key={s.label} className="panel p-5 card-hover">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-violet-soft" />
              {s.hint && <span className="text-[11px] text-muted">{s.hint}</span>}
            </div>
            <p className="mt-3 text-[26px] font-semibold tracking-tight text-ink tabular">{s.value}</p>
            <p className="mt-1 text-[13px] text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-ink">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} href={a.href} className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${a.tint}`}>
                <a.icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-[13.5px] font-medium text-ink">{a.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <FileText className="h-4 w-4 text-violet-soft" /> Recent documents
            </h2>
            <Link href="/app/documents" className="text-[13px] font-medium text-violet-soft hover:text-ink">View all</Link>
          </div>
          {recentDocs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload your first paper, PDF or document to start building your research library."
              action={<Link href="/app/documents?upload=1" className="btn-ghost px-5 py-2.5 text-[13.5px]">Upload a document</Link>}
            />
          ) : (
            <ul className="flex flex-col divide-y divide-white/[0.05]">
              {recentDocs.map((d) => (
                <li key={d.id}>
                  <Link href={`/app/documents/${d.id}`} className="flex items-center gap-3 py-3 transition-colors hover:bg-white/[0.02]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                      <FileText className="h-4 w-4 text-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">{d.title}</p>
                      <p className="text-[12px] text-muted">{formatBytes(d.file_size)} · {timeAgo(d.created_at)}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                <MessageSquareText className="h-4 w-4 text-electric-bright" /> Recent conversations
              </h2>
              <Link href="/app/chat" className="text-[13px] font-medium text-violet-soft hover:text-ink">Open chat</Link>
            </div>
            {(convosRes.data ?? []).length === 0 ? (
              <EmptyState icon={MessageSquareText} title="No conversations yet" description="Ask questions about your documents and get grounded, cited answers." action={<Link href="/app/chat" className="btn-ghost px-5 py-2.5 text-[13.5px]">Start a chat</Link>} />
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.05]">
                {(convosRes.data ?? []).slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link href={`/app/chat?c=${c.id}`} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-electric/20 bg-electric/10">
                        <MessagesSquare className="h-4 w-4 text-electric-bright" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-ink">{c.title}</p>
                        <p className="text-[12px] text-muted">{timeAgo(c.last_message_at)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted/50" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                <FolderKanban className="h-4 w-4 text-lavender" /> Research projects
              </h2>
              <Link href="/app/projects" className="text-[13px] font-medium text-violet-soft hover:text-ink">All projects</Link>
            </div>
            {(projectsRes.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-[13.5px] text-muted">
                No projects yet — <Link href="/app/projects?new=1" className="text-violet-soft hover:text-ink">create one</Link> to organize your research.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(projectsRes.data ?? []).slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/app/projects/${p.id}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-ink transition-colors hover:border-violet/40 hover:bg-violet/10">
                    <FolderKanban className="h-3.5 w-3.5 text-violet-soft" />
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Credits strip */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-violet/20 bg-gradient-to-r from-violet/15 to-electric/10 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/20">
            <Sparkles className="h-5.5 w-5.5 text-violet-soft" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">{credits.balance} credits remaining</p>
            <p className="text-[13px] text-muted">of {credits.monthlyAllowance} monthly · resets {new Date(credits.nextReset).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          </div>
        </div>
        <Link href="/app/settings/billing" className="btn-ghost px-5 py-2.5 text-[13.5px]">
          Manage plan <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
