"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { GraphData, NodeObject } from "react-force-graph-2d";
import type { MemoryLink, MemoryNode } from "@/lib/memories";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Loading graph…</div>,
});

const categoryColors: Record<MemoryNode["category"], string> = {
  Profile: "#4f46e5",
  Education: "#0f766e",
  Goals: "#c2410c",
};

type Props = {
  memories: MemoryNode[];
  relationships: MemoryLink[];
  selectedMemoryId: string | null;
  onSelectMemory: (memory: MemoryNode | null) => void;
};

export default function MemoryGraph({ memories, relationships, selectedMemoryId, onSelectMemory }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  const graphData: GraphData<MemoryNode, MemoryLink> = { nodes: memories, links: relationships };

  return (
    <div ref={containerRef} className="relative h-[460px] w-full overflow-hidden rounded-xl bg-slate-50">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#f8fafc"
          nodeId="id"
          nodeRelSize={6}
          nodeVal={(node: NodeObject<MemoryNode>) => (node.category === "Profile" ? 2 : 1)}
          nodeColor={(node: NodeObject<MemoryNode>) => categoryColors[node.category]}
          nodeLabel={(node: NodeObject<MemoryNode>) => `${node.text} · ${node.category}`}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node: NodeObject<MemoryNode>, context, globalScale) => {
            if (node.x === undefined || node.y === undefined) return;
            const isSelected = node.id === selectedMemoryId;
            const radius = node.category === "Profile" ? 8 : 6;
            context.beginPath();
            context.arc(node.x, node.y, radius + (isSelected ? 3 : 0), 0, 2 * Math.PI);
            context.fillStyle = categoryColors[node.category];
            context.fill();
            if (isSelected) {
              context.strokeStyle = "#c7d2fe";
              context.lineWidth = 2 / globalScale;
              context.stroke();
            }

            const fontSize = Math.max(11 / globalScale, 3.5);
            context.font = `${isSelected ? "600" : "500"} ${fontSize}px Arial, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "top";
            context.fillStyle = "#1e293b";
            context.fillText(node.text, node.x, node.y + radius + 5);
          }}
          linkColor={() => "#cbd5e1"}
          linkWidth={1.5}
          linkLabel={(link) => link.relationship}
          onNodeClick={(node) => {
            const memory = memories.find((item) => item.id === node.id) ?? null;
            onSelectMemory(memory);
          }}
          onBackgroundClick={() => onSelectMemory(null)}
          cooldownTicks={100}
          enableNodeDrag
        />
      )}
    </div>
  );
}
