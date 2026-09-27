"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { sampleMemories, sampleRelationships, type MemoryNode } from "@/lib/memories";

const MemoryGraph = dynamic(() => import("@/components/MemoryGraph"), {
  ssr: false,
  loading: () => <div className="grid h-[460px] place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">Loading graph…</div>,
});

const categoryStyles: Record<MemoryNode["category"], string> = {
  Profile: "bg-indigo-100 text-indigo-700",
  Education: "bg-teal-100 text-teal-700",
  Goals: "bg-orange-100 text-orange-800",
};

export default function GraphPrototype() {
  const [selectedMemory, setSelectedMemory] = useState<MemoryNode | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Memory graph</h2>
          <p className="mt-1 text-sm text-slate-600">Sample memories connected by their relationships.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600" aria-label="Memory categories">
          {Object.entries(categoryStyles).map(([category, style]) => (
            <span key={category} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${style.split(" ")[0]}`} aria-hidden="true" />
              {category}
            </span>
          ))}
        </div>
      </div>

      <MemoryGraph
        memories={sampleMemories}
        relationships={sampleRelationships}
        selectedMemoryId={selectedMemory?.id ?? null}
        onSelectMemory={setSelectedMemory}
      />

      <div className="mt-4 min-h-24 rounded-xl border border-slate-200 p-4" aria-live="polite">
        {selectedMemory ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{selectedMemory.text}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryStyles[selectedMemory.category]}`}>
                {selectedMemory.category}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium text-slate-700">Source:</span> {selectedMemory.source}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a node to inspect its memory and source.</p>
        )}
      </div>
    </section>
  );
}
