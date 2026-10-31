import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Download, MessageSquareText, ArrowLeft, HardDrive, Layers, Calendar } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCreditBalance } from "@/lib/credits";
import StatusBadge from "@/components/app/StatusBadge";
import DocumentActions from "@/components/app/DocumentActions";
import SummaryPanel, { type SummaryData } from "@/components/app/SummaryPanel";
import EmptyState from "@/components/app/EmptyState";
import { formatBytes, timeAgo } from "@/lib/utils";

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, original_filename, file_type, file_size, status, created_at, pinned, summary_available, summary, page_count, extracted_text_available, error_message, workspace_id, owner_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!doc) notFound();

  const chunkQuery = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("document_id", params.id);
  const chunkCount = (chunkQuery as unknown as { count: number | null }).count ?? 0;

  const credits = await getCreditBalance(user.id);

  let summary: SummaryData | null = null;
  if (doc.summary_available && doc.summary) {
    try {
      summary = typeof doc.summary === "string" ? JSON.parse(doc.summary) : (doc.summary as unknown as SummaryData);
    } catch {
      summary = null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/documents" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All documents
        </Link>
      </div>

      <section className="panel p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <FileText className="h-6.5 w-6.5 text-violet-soft" />
            </span>
            <div>
              <h1 className="font-serif text-[26px] leading-tight text-ink">{doc.title}</h1>
              <p className="mt-1 text-[13px] text-muted">{doc.original_filename}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={doc.status} />
                <span className="flex items-center gap-1 text-[12.5px] text-muted">
                  <HardDrive className="h-3.5 w-3.5" /> {formatBytes(doc.file_size)}
                </span>
                <span className="flex items-center gap-1 text-[12.5px] text-muted">
                  <Layers className="h-3.5 w-3.5" /> {chunkCount} chunks indexed
                </span>
                <span className="flex items-center gap-1 text-[12.5px] text-muted">
                  <Calendar className="h-3.5 w-3.5" /> Uploaded {timeAgo(doc.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/documents/${doc.id}/download`}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-white/5"
            >
              <Download className="h-4 w-4" /> Download
            </a>
            <Link
              href={`/app/chat?c=&docs=${doc.id}`}
              className="btn-ghost px-4 py-2.5 text-[13px]"
            >
              <MessageSquareText className="h-4 w-4" /> Ask AI
            </Link>
            <DocumentActions documentId={doc.id} title={doc.title} status={doc.status} />
          </div>
        </div>

        {doc.status === "failed" && (
          <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-200">
            {doc.error_message ?? "Processing failed. You can retry with the refresh button."}
          </div>
        )}
        {doc.status !== "completed" && doc.status !== "failed" && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[13px] text-amber-200/90">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
            This document is still being processed. Refresh in a moment — summaries and chat become available once extraction finishes.
          </div>
        )}
      </section>

      {doc.status === "completed" && doc.extracted_text_available && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">AI summary</h2>
          <SummaryPanel documentId={doc.id} documentTitle={doc.title} existing={summary} credits={credits.balance} />
        </section>
      )}

      {doc.status === "completed" && !doc.extracted_text_available && (
        <EmptyState icon={FileText} title="No text extracted" description="This document finished processing but produced no extractable text." />
      )}
    </div>
  );
}
