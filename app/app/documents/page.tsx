import Link from "next/link";
import { FileText, Search, ArrowUpDown, Pin, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getWorkspaceId } from "@/lib/app-data";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/app/EmptyState";
import StatusBadge from "@/components/app/StatusBadge";
import UploadDropzone from "@/components/app/UploadDropzone";
import DocumentActions from "@/components/app/DocumentActions";
import { formatBytes, timeAgo } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "", label: "All" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
];

const TYPE_ICON: Record<string, string> = {
  pdf: "text-red-300",
  docx: "text-electric-bright",
  txt: "text-violet-soft",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { upload?: string; q?: string; status?: string; sort?: string };
}) {
  const user = await requireUser();
  const workspaceId = await getWorkspaceId(user.id);
  const supabase = createClient();

  const q = searchParams.q?.toLowerCase() ?? "";
  const status = searchParams.status ?? "";
  const sort = searchParams.sort ?? "newest";
  const showUpload = searchParams.upload === "1";

  let query = supabase
    .from("documents")
    .select("id, title, original_filename, file_type, file_size, status, created_at, pinned, summary_available, error_message")
    .eq("workspace_id", workspaceId ?? "");

  if (status) query = query.eq("status", status);
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

  const { data: docs } = await query.limit(200);
  const documents = docs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-ink">Documents</h1>
          <p className="mt-1 text-[13.5px] text-muted">
            Your research library — {documents.length} document{documents.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (window.location.href = "/app/documents?upload=1")}
          className="btn-primary h-11 px-6 text-[14px]"
        >
          <Plus className="h-4 w-4" /> Upload
        </button>
      </div>

      {/* Upload dropzone */}
      {showUpload && (
        <section className="panel p-5">
          <UploadDropzone onUploaded={() => { window.location.href = "/app/documents"; }} />
        </section>
      )}

      {/* Toolbar */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form method="get" action="/app/documents" className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search documents…"
            className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[13.5px] text-ink placeholder:text-muted/60 outline-none focus:border-violet/50 focus:ring-2 focus:ring-violet/15"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.id}
              href={`/app/documents?${new URLSearchParams({ status: f.id, q, sort }).toString()}`}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                status === f.id
                  ? "border border-violet/40 bg-violet/15 text-violet-soft"
                  : "border border-white/10 text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          ))}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => {
                const params = new URLSearchParams({ status, q, sort: e.target.value });
                window.location.href = `/app/documents?${params.toString()}`;
              }}
              aria-label="Sort documents"
              className="h-10 appearance-none rounded-full border border-white/10 bg-white/[0.03] pl-4 pr-9 text-[13px] text-ink outline-none focus:border-violet/50"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name A–Z</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
        </div>
      </section>

      {/* Grid */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={q || status ? "No documents match" : "No documents yet"}
          description={
            q || status
              ? "Try clearing your search or filters."
              : "Upload your first paper, PDF or document to start building your research library."
          }
          action={
            !q && !status ? (
              <Link href="/app/documents?upload=1" className="btn-primary px-6 py-3 text-[14px]">
                <Plus className="h-4 w-4" /> Upload a document
              </Link>
            ) : undefined
          }
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc.id} className="panel group relative flex flex-col p-5 card-hover">
              {doc.pinned && (
                <span className="absolute right-4 top-4 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-violet-soft">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <FileText className={`h-5 w-5 ${TYPE_ICON[doc.file_type] ?? "text-muted"}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/app/documents/${doc.id}`} className="block">
                    <p className="truncate text-[14.5px] font-semibold text-ink transition-colors group-hover:text-violet-soft">
                      {doc.title}
                    </p>
                  </Link>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">
                    {doc.file_type.toUpperCase()} · {formatBytes(doc.file_size)} · {timeAgo(doc.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={doc.status} />
                <DocumentActions documentId={doc.id} title={doc.title} status={doc.status} />
              </div>

              {doc.status === "failed" && doc.error_message && (
                <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-[12px] leading-snug text-red-200/80">
                  {doc.error_message}
                </p>
              )}

              {doc.status === "completed" && (
                <Link
                  href={`/app/documents/${doc.id}`}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-white/10 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-violet/40 hover:bg-violet/10 hover:text-violet-soft"
                >
                  {doc.summary_available ? "View summary" : "Open document"}
                </Link>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
