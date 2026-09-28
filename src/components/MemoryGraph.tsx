"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ForceGraphMethods, GraphData, NodeObject } from "react-force-graph-2d";
import { typeColors, typeLabels, type ContextItem, type ContextLink } from "@/lib/context";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Loading context graph…</div>,
});

/** Memory nodes get per-category colors; everything else uses typeColors. */
const memoryCategoryColors: Record<string, string> = {
  Profile: "#9b8cff",
  Education: "#40edcf",
  Goals: "#ff956e",
};

function getNodeColor(item: ContextItem): string {
  if (item.type === "memory" && item.category) {
    return memoryCategoryColors[item.category] ?? typeColors.memory;
  }
  return typeColors[item.type] ?? "#94a3b8";
}

type Props = {
  items: ContextItem[];
  links: ContextLink[];
  selectedItemId: string | null;
  onSelectItem: (item: ContextItem | null) => void;
};

export default function MemoryGraph({ items, links, selectedItemId, onSelectItem }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo<GraphData<ContextItem, ContextLink>>(
    () => ({ nodes: items, links }),
    [items, links],
  );

  // Keep graph compact and auto-fit to container
  useEffect(() => {
    const linkForce = graphRef.current?.d3Force("link");
    const chargeForce = graphRef.current?.d3Force("charge");
    linkForce?.distance(100);
    chargeForce?.strength(-170);
    graphRef.current?.d3ReheatSimulation();

    // Auto-fit so every node is immediately in view
    const timer = setTimeout(() => {
      graphRef.current?.zoomToFit(400, 45);
    }, 350);
    return () => clearTimeout(timer);
  }, [dimensions.width, dimensions.height, items.length]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-transparent">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          nodeId="id"
          nodeRelSize={7}
          nodeVal={(rawNode) => {
            const node = rawNode as NodeObject<ContextItem>;
            if (node.id === "user") return 3;
            return Math.max(1, Math.min(3.5, 1 + Math.sqrt(node.token_count ?? 0) * 0.2));
          }}
          nodeColor={(rawNode) => getNodeColor(rawNode as NodeObject<ContextItem>)}
          nodeLabel={(rawNode) => {
            const node = rawNode as NodeObject<ContextItem>;
            const suffix = node.status === "compressed" ? " (compressed)" : "";
            const categoryText = node.category ? ` [${node.category}]` : "";
            const typeText = typeLabels[node.type] ?? node.type;
            return `${node.text} · ${typeText}${categoryText}${suffix}`;
          }}
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={(rawNode, context, globalScale) => {
            const node = rawNode as NodeObject<ContextItem>;
            if (node.x === undefined || node.y === undefined) return;

            const isSelected = node.id === selectedItemId;
            const isCompressed = node.status === "compressed";
            const opacity = isCompressed ? 0.28 : 1.0;

            const isAnchor = node.id === "user" || node.type === "user_anchor";
            const baseRadius = isAnchor
              ? 12
              : Math.min(13, Math.max(7, 5 + Math.sqrt(node.token_count ?? 0) * 0.7));
            const radius = baseRadius / globalScale;
            const color = getNodeColor(node);

            context.save();
            context.globalAlpha = opacity;

            // Main glowing circle
            context.beginPath();
            context.arc(node.x, node.y, radius + (isSelected ? 3 / globalScale : 0), 0, 2 * Math.PI);
            context.shadowColor = color;
            context.shadowBlur = isCompressed ? 4 / globalScale : (isAnchor ? 25 / globalScale : 18 / globalScale);
            context.fillStyle = color;
            context.fill();
            context.shadowBlur = 0;

            // Inner center dot
            context.beginPath();
            context.arc(node.x, node.y, (isAnchor ? 4 : 3) / globalScale, 0, 2 * Math.PI);
            context.fillStyle = "#ffffff";
            context.fill();

            // Selection ring
            if (isSelected) {
              context.beginPath();
              context.arc(node.x, node.y, radius + 5 / globalScale, 0, 2 * Math.PI);
              context.strokeStyle = "#38bdf8";
              context.lineWidth = 1.6 / globalScale;
              context.stroke();
            }

            // Compressed indicator — dashed outer boundary
            if (isCompressed) {
              context.beginPath();
              context.arc(node.x, node.y, radius + 4 / globalScale, 0, 2 * Math.PI);
              context.setLineDash([3 / globalScale, 3 / globalScale]);
              context.strokeStyle = "rgba(255,255,255,0.3)";
              context.lineWidth = 0.9 / globalScale;
              context.stroke();
              context.setLineDash([]);
            }

            // Label text below node
            const fontSize = Math.max(10, 11) / globalScale;
            context.font = `${isSelected || isAnchor ? "600" : "500"} ${fontSize}px Arial, Helvetica, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "top";
            context.fillStyle = `rgba(255,255,255,${isCompressed ? 0.45 : 0.95})`;
            context.shadowColor = "rgba(0,0,0,0.95)";
            context.shadowBlur = 4 / globalScale;
            context.fillText(node.text, node.x, node.y + radius + 8 / globalScale);

            context.restore();
          }}
          // nodePointerAreaPaint provides generous 1-click hit detection!
          nodePointerAreaPaint={(rawNode, color, context, globalScale) => {
            const node = rawNode as NodeObject<ContextItem>;
            if (node.x === undefined || node.y === undefined) return;
            const isAnchor = node.id === "user" || node.type === "user_anchor";
            const baseRadius = isAnchor ? 14 : Math.min(16, Math.max(9, 6 + Math.sqrt(node.token_count ?? 0) * 0.7));
            // Add +8px padding so users can easily click the node on first try
            const hitRadius = (baseRadius + 8) / globalScale;

            context.save();
            context.beginPath();
            context.arc(node.x, node.y, hitRadius, 0, 2 * Math.PI);
            context.fillStyle = color;
            context.fill();
            context.restore();
          }}
          linkColor={() => "rgba(255,255,255,0.35)"}
          linkWidth={0.8}
          linkLabel={(link) => (link as ContextLink).relationship}
          onNodeClick={(node) => {
            const item = items.find((i) => i.id === node.id) ?? null;
            onSelectItem(item);
          }}
          onBackgroundClick={() => onSelectItem(null)}
          cooldownTicks={100}
          d3AlphaDecay={0.03}
          minZoom={0.3}
          maxZoom={3.5}
          enableNodeDrag
        />
      )}

      {/* Recenter & Fit view button */}
      <button
        type="button"
        onClick={() => graphRef.current?.zoomToFit(400, 45)}
        className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white/60 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        title="Fit all context nodes in view"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
          <path d="M3 7V3m0 0h4M3 3l5 5m9-1V3m0 0h-4m4 0l-5 5M3 13v4m0 0h4m-4 0l5-5m9 5v-4m0 4h-4m4 0l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Fit in view
      </button>
    </div>
  );
}
