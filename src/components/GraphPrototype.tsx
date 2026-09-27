"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MemoryLink, MemoryNode } from "@/lib/memories";

const MemoryGraph = dynamic(() => import("@/components/MemoryGraph"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-white/35">Preparing context map…</div>,
});

const categoryStyles: Record<MemoryNode["category"], { dot: string; text: string }> = {
  Profile: { dot: "bg-indigo-400", text: "text-indigo-200" },
  Education: { dot: "bg-teal-300", text: "text-teal-100" },
  Goals: { dot: "bg-orange-300", text: "text-orange-100" },
};

type Props = {
  memories: MemoryNode[];
  relationships: MemoryLink[];
  onDeleteMemory: (id: string) => void;
};

export default function GraphPrototype({ memories, relationships, onDeleteMemory }: Props) {
  const [selectedMemory, setSelectedMemory] = useState<MemoryNode | null>(null);

  return (
    <section className="absolute inset-0 z-0" aria-label="Memory graph">
      {memories.length > 1 && (
        <MemoryGraph
          memories={memories}
          relationships={relationships}
          selectedMemoryId={selectedMemory?.id ?? null}
          onSelectMemory={setSelectedMemory}
        />
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/80">Context</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/35">Prototype</span>
          </div>
          <p className="mt-2 hidden text-xs text-white/35 sm:block">A map of what your assistant knows</p>
        </div>

        <div className="pointer-events-auto flex max-w-[70%] flex-wrap items-center justify-end gap-x-4 gap-y-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-2 backdrop-blur-xl sm:px-4">
          {Object.entries(categoryStyles).map(([category, style]) => (
            <span key={category} className={`flex items-center gap-1.5 text-[10px] ${style.text} sm:text-xs`}>
              <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor] ${style.dot}`} aria-hidden="true" />
              {category}
            </span>
          ))}
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="text-[10px] tabular-nums text-white/40 sm:text-xs">{Math.max(0, memories.length - 1)} memories</span>
        </div>
      </header>

      {selectedMemory && selectedMemory.id !== "user" && (
        <aside className="absolute right-4 top-20 z-20 w-[min(320px,calc(100vw-32px))] rounded-2xl border border-white/[0.14] bg-[#10131a]/75 p-4 shadow-[0_12px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:right-8 sm:top-24" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-white">{selectedMemory.text}</h2>
              <span className={`mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] ${categoryStyles[selectedMemory.category].text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${categoryStyles[selectedMemory.category].dot}`} />
                {selectedMemory.category}
              </span>
            </div>
            <button type="button" onClick={() => setSelectedMemory(null)} aria-label="Close memory details" className="rounded-full p-1 text-white/45 hover:bg-white/10 hover:text-white">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/55">{selectedMemory.source}</p>
          <button
            type="button"
            onClick={() => {
              onDeleteMemory(selectedMemory.id);
              setSelectedMemory(null);
            }}
            className="mt-4 rounded-full border border-rose-300/20 px-3 py-1.5 text-xs text-rose-200/80 transition hover:border-rose-200/40 hover:bg-rose-300/10 hover:text-rose-100"
          >
            Forget this memory
          </button>
        </aside>
      )}
    </section>
  );
}
