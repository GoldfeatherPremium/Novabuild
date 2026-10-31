import Link from "next/link";
import { History, MessageSquareText, Search, Pin } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/app/EmptyState";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { q?: string; pinned?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();

  const q = searchParams.q?.toLowerCase() ?? "";
  const onlyPinned = searchParams.pinned === "1";

  let query = supabase
    .from("conversations")
    .select("id, title, pinned, archived, last_message_at, created_at, owner_id")
    .eq("owner_id", user.id)
    .eq("archived", false);

  if (onlyPinned) query = query.eq("pinned", true);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data: convos } = await query.order("last_message_at", { ascending: false }).limit(200);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] leading-tight text-ink">Conversation history</h1>
        <p className="mt-1 text-[13.5px] text-muted">Every AI conversation, searchable and ready to resume.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form method="get" action="/app/history" className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
          <input name="q" defaultValue={q} placeholder="Search conversations…" className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[13.5px] text-ink placeholder:text-muted/60 outline-none focus:border-violet/50 focus:ring-2 focus:ring-violet/15" />
        </form>
        <Link
          href={`/app/history?${new URLSearchParams({ q, pinned: onlyPinned ? "" : "1" }).toString()}`}
          className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors ${onlyPinned ? "border border-violet/40 bg-violet/15 text-violet-soft" : "border border-white/10 text-muted hover:text-ink"}`}
        >
          <Pin className="h-3.5 w-3.5" /> Pinned
        </Link>
      </div>

      {(convos ?? []).length === 0 ? (
        <EmptyState
          icon={History}
          title={q || onlyPinned ? "No conversations match" : "No conversations yet"}
          description={q || onlyPinned ? "Try adjusting your search or filters." : "Ask your documents questions in AI chat — they'll show up here."}
          action={<Link href="/app/chat" className="btn-primary px-6 py-3 text-[14px]"><MessageSquareText className="h-4 w-4" /> Start a chat</Link>}
        />
      ) : (
        <section className="panel overflow-hidden">
          <ul className="divide-y divide-white/[0.05]">
            {(convos ?? []).map((c) => (
              <li key={c.id}>
                <Link href={`/app/chat?c=${c.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-electric/20 bg-electric/10">
                    <MessageSquareText className="h-4.5 w-4.5 text-electric-bright" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[14px] font-medium text-ink">
                      {c.title}
                      {c.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-violet-soft" />}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      Last activity {timeAgo(c.last_message_at)} · created {timeAgo(c.created_at)}
                    </p>
                  </div>
                  <span className="text-[13px] font-medium text-violet-soft">Resume →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
