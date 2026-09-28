"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { typeLabels, type ContextItem, type ContextLink, type ContextSnapshot } from "@/lib/context";

const MemoryGraph = dynamic(() => import("@/components/MemoryGraph"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-white/35">Preparing context map…</div>,
});

const typeLegend: Array<{ label: string; color: string; textColor: string }> = [
  { label: "You", color: "bg-sky-400", textColor: "text-sky-200" },
  { label: "Messages", color: "bg-blue-400", textColor: "text-blue-200" },
  { label: "AI Replies", color: "bg-violet-400", textColor: "text-violet-200" },
  { label: "Memories", color: "bg-teal-300", textColor: "text-teal-100" },
  { label: "Summaries", color: "bg-amber-400", textColor: "text-amber-100" },
];

type Props = {
  items: ContextItem[];
  links: ContextLink[];
  snapshot: ContextSnapshot | null;
  onDeleteMemory: (id: string) => void;
};

export default function GraphPrototype({ items, links, snapshot, onDeleteMemory }: Props) {
  const [selectedItem, setSelectedItem] = useState<ContextItem | null>(null);

  return (
    <section className="relative h-full w-full overflow-hidden" aria-label="Context graph">
      {items.length > 0 && (
        <MemoryGraph
          items={items}
          links={links}
          selectedItemId={selectedItem?.id ?? null}
          onSelectItem={setSelectedItem}
        />
      )}

      {/* Header bar overlay */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/90">Context Window</span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-emerald-300">
              Live Map
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/40">Visible state of the model&apos;s active context</p>

          {/* Token usage bar */}
          {snapshot && (
            <div className="mt-2.5 w-44 rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur-md">
              <div className="mb-1 flex justify-between text-[9px] text-white/50">
                <span>{snapshot.total_tokens.toLocaleString()} tokens</span>
                <span>{snapshot.max_tokens.toLocaleString()} max</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    snapshot.total_tokens / snapshot.max_tokens > 0.85
                      ? "bg-gradient-to-r from-orange-400 to-rose-500"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, (snapshot.total_tokens / snapshot.max_tokens) * 100))}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[9px] text-white/35">
                <span>Turn {snapshot.current_turn}</span>
                <span>{Math.round((snapshot.total_tokens / snapshot.max_tokens) * 100)}% budget</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-xl">
          {typeLegend.map(({ label, color, textColor }) => (
            <span key={label} className={`flex items-center gap-1.5 text-[10px] ${textColor}`}>
              <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${color}`} aria-hidden="true" />
              {label}
            </span>
          ))}
          <span className="h-3 w-px bg-white/15" />
          <span className="text-[10px] tabular-nums text-white/50">
            {items.filter((i) => i.status === "active").length} active
          </span>
        </div>
      </header>

      {/* Inspector panel */}
      {selectedItem && (
        <aside
          className="absolute right-4 top-20 z-20 w-[min(320px,calc(100vw-32px))] rounded-2xl border border-white/15 bg-[#0e1118]/90 p-4 shadow-[0_16px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{selectedItem.text}</h2>
              <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/55">
                {typeLabels[selectedItem.type] ?? selectedItem.type}
                {selectedItem.category && (
                  <span className="ml-1 text-teal-300">· {selectedItem.category}</span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              aria-label="Close details"
              className="rounded-full p-1 text-white/45 hover:bg-white/10 hover:text-white"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-white/70">{selectedItem.content}</p>

          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2 text-[10px] text-white/40">
            <span>Turn {selectedItem.turn_added}</span>
            <span>·</span>
            <span>{selectedItem.token_count} tokens</span>
            <span>·</span>
            <span className={selectedItem.status === "compressed" ? "font-medium text-amber-300" : "font-medium text-emerald-300"}>
              {selectedItem.status}
            </span>
          </div>

          {selectedItem.compressed_from && selectedItem.compressed_from.length > 0 && (
            <p className="mt-2 text-[10px] text-amber-200/60">
              Summarized from {selectedItem.compressed_from.length} conversation items
            </p>
          )}

          {selectedItem.type === "memory" && (
            <button
              type="button"
              onClick={() => {
                onDeleteMemory(selectedItem.id);
                setSelectedItem(null);
              }}
              className="mt-3.5 w-full rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 text-center text-xs text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-500/20"
            >
              Forget this memory
            </button>
          )}
        </aside>
      )}
    </section>
  );
}
