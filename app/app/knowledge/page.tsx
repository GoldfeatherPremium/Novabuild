"use client";

import { useEffect, useMemo, useState } from "react";
import { Share2, FileText, Lightbulb, Loader2 } from "lucide-react";
import EmptyState from "@/components/app/EmptyState";

interface Node {
  id: string;
  label: string;
  type: string;
  meta?: { fileType?: string } | null;
  doc_count?: number;
}

interface Edge {
  id: string;
  source_id: string;
  target_id: string;
  relation: string;
  weight: number;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

const TYPE_COLOR: Record<string, string> = {
  document: "#8E7CFF",
  concept: "#41A6FF",
  topic: "#63BCFF",
  project: "#C9C2FF",
};

export default function KnowledgePage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/knowledge");
      const body = await res.json().catch(() => ({}));
      setData({ nodes: body.nodes ?? [], edges: body.edges ?? [] });
      setLoading(false);
    })();
  }, []);

  const positioned = useMemo(() => {
    if (!data || data.nodes.length === 0) return [];
    const n = data.nodes.length;
    const R = Math.max(120, n * 34);
    const cx = 300;
    const cy = 260;
    return data.nodes.map((node, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { node, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
    });
  }, [data]);

  const nodeById = useMemo(() => {
    const m = new Map<string, Node>();
    data?.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-7 w-7 animate-spin text-violet-soft" />
        <p className="text-[13.5px] text-muted">Building your knowledge graph…</p>
      </div>
    );
  }

  if (!data || data.nodes.length === 0 || data.edges.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-ink">Knowledge graph</h1>
          <p className="mt-1 text-[13.5px] text-muted">See how your documents and concepts connect.</p>
        </div>
        <EmptyState
          icon={Share2}
          title="Not enough connected knowledge yet"
          description="As you tag documents and build projects, real relationships will appear here. Nothing is fabricated — the graph only shows genuine links derived from your data."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] leading-tight text-ink">Knowledge graph</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          {data.nodes.length} subjects · {data.edges.length} relationships — derived from your data.
        </p>
      </div>

      <div className="panel relative overflow-hidden">
        <svg viewBox="0 0 600 520" className="w-full" role="img" aria-label="Knowledge graph">
          <defs>
            <linearGradient id="kg-edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7568FF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#41A6FF" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Edges */}
          {data.edges.map((e) => {
            const s = positioned.find((p) => p.node.id === e.source_id);
            const t = positioned.find((p) => p.node.id === e.target_id);
            if (!s || !t) return null;
            return (
              <line
                key={e.id}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke="url(#kg-edge)"
                strokeWidth={Math.max(1, Math.min(4, e.weight))}
                className="transition-opacity"
                opacity={hovered && hovered !== s.node.id && hovered !== t.node.id ? 0.15 : 1}
              />
            );
          })}

          {/* Nodes */}
          {positioned.map(({ node, x, y }) => {
            const color = TYPE_COLOR[node.type] ?? "#8E97B5";
            const isDoc = node.type === "document";
            const r = isDoc ? 18 : 13;
            return (
              <g
                key={node.id}
                transform={`translate(${x},${y})`}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <circle r={r + 6} fill={color} opacity={hovered === node.id ? 0.18 : 0.06} />
                <circle r={r} fill={color} opacity={hovered === node.id ? 0.35 : 0.18} stroke={color} strokeWidth="1.5" />
                {isDoc ? (
                  <FileText x={-8} y={-8} width={16} height={16} color={color} />
                ) : (
                  <Lightbulb x={-6} y={-6} width={12} height={12} color={color} />
                )}
                <text y={r + 18} textAnchor="middle" fill="#8E97B5" fontSize="11" fontWeight="500">
                  {node.label.length > 24 ? node.label.slice(0, 23) + "…" : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover detail */}
        {hovered && nodeById.has(hovered) && (
          <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/[0.10] bg-surface/95 px-4 py-3 shadow-card backdrop-blur">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
              {nodeById.get(hovered)!.type === "document" ? <FileText className="h-3.5 w-3.5 text-violet-soft" /> : <Lightbulb className="h-3.5 w-3.5 text-electric-bright" />}
              {nodeById.get(hovered)!.label}
            </p>
            <p className="mt-0.5 text-[12px] text-muted capitalize">{nodeById.get(hovered)!.type}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR.document }} /> Document</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR.concept }} /> Concept</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR.topic }} /> Topic</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR.project }} /> Project</span>
      </div>
    </div>
  );
}
