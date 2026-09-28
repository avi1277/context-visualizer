"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import GraphPrototype from "@/components/GraphPrototype";
import { userNode, type ContextSnapshot } from "@/lib/context";
import { getContext, sendMessage as sendMessageApi, deleteMemoryApi } from "@/lib/api";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string };

const demoPrompts = [
  "I'm a sophomore studying Computer Engineering at Brown.",
  "I want to become a Product Manager.",
  "How do I cook great fried rice?",
];

export default function ContextWorkspace() {
  const [snapshot, setSnapshot] = useState<ContextSnapshot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"both" | "graph" | "chat">("both");
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getContext()
      .then((data) => setSnapshot(data))
      .catch((err) => {
        console.warn("Could not fetch initial context from backend:", err);
      });
  }, []);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) {
      conversation.scrollTop = conversation.scrollHeight;
    }
  }, [messages, isSending]);

  async function handleSendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    setMessages((current) => [...current, { id: Date.now(), role: "user", text: message }]);
    setDraft("");
    setIsSending(true);
    try {
      const result = await sendMessageApi(message);
      setSnapshot(result.context);
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: result.reply }]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process message";
      const isConnectionError = errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError");
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: isConnectionError
            ? "Cannot reach backend at http://localhost:8000. Please start the FastAPI backend server."
            : `Error: ${errorMsg}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage(draft);
    }
  }

  async function deleteMemory(id: string) {
    try {
      const result = await deleteMemoryApi(id);
      setSnapshot(result.context);
    } catch {
      if (snapshot) {
        setSnapshot({
          ...snapshot,
          items: snapshot.items.filter((item) => item.id !== id),
          links: snapshot.links.filter((link) => link.source !== id && link.target !== id),
        });
      }
    }
  }

  const graphItems = snapshot ? [userNode, ...snapshot.items] : [userNode];
  const graphLinks = snapshot?.links ?? [];

  return (
    <main className="fixed inset-0 flex flex-col md:flex-row overflow-hidden bg-[#05060a] text-white">
      {/* Ambient background glow */}
      <div className="workspace-ambient pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

      {/* Mobile view switcher tab */}
      <div className="z-30 flex shrink-0 items-center justify-center border-b border-white/10 bg-[#080a10]/80 p-2 backdrop-blur-md md:hidden">
        <div className="flex rounded-full border border-white/10 bg-black/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("graph")}
            className={`rounded-full px-4 py-1 transition ${activeTab === "graph" ? "bg-white/15 text-white" : "text-white/50"}`}
          >
            Context Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`rounded-full px-4 py-1 transition ${activeTab === "chat" ? "bg-white/15 text-white" : "text-white/50"}`}
          >
            Chat ({messages.length})
          </button>
        </div>
      </div>

      {/* LEFT PANEL: Dedicated Context Graph (Always 100% visible, no scrolling needed) */}
      <section
        className={`relative flex-1 h-full min-h-0 min-w-0 z-10 ${
          activeTab === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        <GraphPrototype
          items={graphItems}
          links={graphLinks}
          snapshot={snapshot}
          onDeleteMemory={deleteMemory}
        />
      </section>

      {/* RIGHT PANEL: Dedicated Chat Sidebar (Clean, non-overlapping) */}
      <aside
        className={`w-full md:w-[380px] lg:w-[420px] shrink-0 h-full flex flex-col border-l border-white/10 bg-[#090c14]/90 backdrop-blur-2xl relative z-20 ${
          activeTab === "graph" ? "hidden md:flex" : "flex"
        }`}
        aria-label="Assistant Conversation"
      >
        {/* Chat panel header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/90">AI Assistant</span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/45">
            Gemini 3.x Flash
          </span>
        </div>

        {/* Message history */}
        <div
          ref={conversationRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center text-center px-2 py-6 text-white/50">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-cyan-300">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-white/90">Start the conversation</h3>
              <p className="mt-1.5 max-w-[260px] text-xs leading-5 text-white/45">
                Tell me about yourself, what you study, or ask any question. Watch your context map evolve on the left!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                <span className="mb-1 text-[10px] text-white/30 uppercase tracking-wider px-1">
                  {message.role === "user" ? "You" : "Assistant"}
                </span>
                <div
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-tr-sm border border-sky-400/20 bg-sky-500/15 text-white shadow-sm"
                      : "rounded-tl-sm border border-white/10 bg-white/[0.05] text-white/90"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-cyan-200/60 p-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Thinking and mapping context…
            </div>
          )}
        </div>

        {/* Suggested prompt chips */}
        <div className="shrink-0 border-t border-white/[0.08] px-3 pt-2.5 pb-1">
          <div className="flex flex-wrap gap-1.5">
            {demoPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isSending}
                onClick={() => void handleSendMessage(prompt)}
                className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-left text-[11px] text-white/60 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              >
                {prompt.length > 28 ? prompt.slice(0, 26) + "…" : prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input container */}
        <div className="shrink-0 p-3 sm:p-4 pt-1">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-2xl border border-white/15 bg-black/40 p-1.5 shadow-lg backdrop-blur-xl sm:p-2"
          >
            <label htmlFor="chat-message" className="sr-only">
              Your message
            </label>
            <textarea
              id="chat-message"
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me something or ask a question…"
              disabled={isSending}
              className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2 text-xs sm:text-sm leading-5 text-white outline-none placeholder:text-white/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              aria-label="Send message"
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-950 transition hover:scale-[1.04] hover:bg-cyan-100 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/20"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M12 19V5m0 0L6 11m6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-white/25">Enter to send · Shift+Enter for new line</p>
        </div>
      </aside>
    </main>
  );
}
