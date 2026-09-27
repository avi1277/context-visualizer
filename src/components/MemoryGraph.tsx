"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ForceGraphMethods, GraphData, NodeObject } from "react-force-graph-2d";
import type { MemoryLink, MemoryNode } from "@/lib/memories";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Loading graph…</div>,
});

const categoryColors: Record<MemoryNode["category"], string> = {
  Profile: "#9b8cff",
  Education: "#40edcf",
  Goals: "#ff956e",
};

type Props = {
  memories: MemoryNode[];
  relationships: MemoryLink[];
  selectedMemoryId: string | null;
  onSelectMemory: (memory: MemoryNode | null) => void;
};

export default function MemoryGraph({ memories, relationships, selectedMemoryId, onSelectMemory }: Props) {
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

  const graphData = useMemo<GraphData<MemoryNode, MemoryLink>>(
    () => ({ nodes: memories, links: relationships }),
    [memories, relationships],
  );

  useEffect(() => {
    const linkForce = graphRef.current?.d3Force("link");
    const chargeForce = graphRef.current?.d3Force("charge");
    linkForce?.distance(165);
    chargeForce?.strength(-260);
    graphRef.current?.d3ReheatSimulation();
  }, [dimensions.width, memories.length]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-transparent">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          nodeId="id"
          nodeRelSize={6}
          nodeVal={(rawNode) => ((rawNode as NodeObject<MemoryNode>).category === "Profile" ? 2 : 1)}
          nodeColor={(rawNode) => categoryColors[(rawNode as NodeObject<MemoryNode>).category]}
          nodeLabel={(rawNode) => {
            const node = rawNode as NodeObject<MemoryNode>;
            return `${node.text} · ${node.category}`;
          }}
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={(rawNode, context, globalScale) => {
            const node = rawNode as NodeObject<MemoryNode>;
            if (node.x === undefined || node.y === undefined) return;
            const isSelected = node.id === selectedMemoryId;
            const radiusPx = node.category === "Profile" ? 10 : 8;
            const radius = radiusPx / globalScale;
            const color = categoryColors[node.category];

            context.save();
            context.beginPath();
            context.arc(node.x, node.y, radius + (isSelected ? 3 / globalScale : 0), 0, 2 * Math.PI);
            context.shadowColor = color;
            context.shadowBlur = 20 / globalScale;
            context.fillStyle = color;
            context.fill();
            context.shadowBlur = 0;

            context.beginPath();
            context.arc(node.x, node.y, 3 / globalScale, 0, 2 * Math.PI);
            context.fillStyle = "#ffffff";
            context.fill();

            if (isSelected) {
              context.beginPath();
              context.arc(node.x, node.y, radius + 5 / globalScale, 0, 2 * Math.PI);
              context.strokeStyle = "rgba(255,255,255,0.72)";
              context.lineWidth = 1.2 / globalScale;
              context.stroke();
            }

            const fontSize = 11 / globalScale;
            context.font = `${isSelected ? "600" : "500"} ${fontSize}px Arial, Helvetica, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "top";
            context.fillStyle = "rgba(255,255,255,0.9)";
            context.shadowColor = "rgba(0,0,0,0.95)";
            context.shadowBlur = 4 / globalScale;
            context.fillText(node.text, node.x, node.y + radius + 8 / globalScale);
            context.restore();
          }}
          linkColor={() => "rgba(255,255,255,0.42)"}
          linkWidth={0.8}
          linkLabel={(link) => link.relationship}
          onNodeClick={(node) => {
            const memory = memories.find((item) => item.id === node.id) ?? null;
            onSelectMemory(memory);
          }}
          onBackgroundClick={() => onSelectMemory(null)}
          cooldownTicks={120}
          d3AlphaDecay={0.025}
          minZoom={0.5}
          maxZoom={2.5}
          enableNodeDrag
        />
      )}
    </div>
  );
}
