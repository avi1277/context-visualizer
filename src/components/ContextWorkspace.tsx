"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import GraphPrototype from "@/components/GraphPrototype";
import { userNode, type MemoryLink, type MemoryNode } from "@/lib/memories";
import { extractMemoriesMock } from "@/lib/mock-extraction";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string };

const demoPrompts = [
  "I'm a sophomore studying Computer Engineering at Brown.",
  "I want to become a Product Manager.",
];

export default function ContextWorkspace() {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [relationships, setRelationships] = useState<MemoryLink[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messages, isSending]);

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    setShowExamples(false);
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: message }]);
    setDraft("");
    setIsSending(true);
    try {
      const result = await extractMemoriesMock(message, memories);
      setMemories((current) => [...current, ...result.memories]);
      setRelationships((current) => [...current, ...result.relationships]);
      const response = result.memories.length
        ? `I added ${result.memories.map((memory) => memory.text).join(", ")} to the graph.`
        : "I didn't find a new detail in a pattern this local demo recognizes. Try sharing your year and major, a career goal, or where you live.";
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: response }]);
    } catch {
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: "assistant",
        text: "I couldn't process that message. Please try again.",
      }]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  function deleteMemory(id: string) {
    setMemories((current) => current.filter((memory) => memory.id !== id));
    setRelationships((current) => current.filter((link) => link.source !== id && link.target !== id));
  }

  const graphMemories = memories.length ? [userNode, ...memories] : [];

  return (
    <main className="workspace-shell fixed inset-0 isolate overflow-hidden bg-[#05060a] text-white">
      <div className="workspace-ambient pointer-events-none absolute inset-0" aria-hidden="true" />

      <GraphPrototype
        memories={graphMemories}
        relationships={relationships}
        onDeleteMemory={deleteMemory}
      />

      {showExamples && (
        <div className="pointer-events-none absolute inset-x-5 bottom-[min(46vh,420px)] z-20 flex -translate-y-2 flex-col items-center px-4 text-center animate-fade-in">
          <span className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-white/35">A living map of your context</span>
          <h1 className="font-editorial max-w-2xl text-3xl font-medium tracking-tight text-white/90 sm:text-5xl">What should your AI remember?</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/45 sm:text-base">Start with a detail about your life, your work, or where you want to go.</p>
        </div>
      )}

      <div
        ref={conversationRef}
        className="conversation-fade absolute inset-x-4 bottom-[158px] z-20 mx-auto flex h-[min(36vh,300px)] min-h-[54px] max-w-3xl flex-col overflow-y-auto px-1 pb-2 pt-8 sm:inset-x-6 sm:bottom-[166px]"
        aria-live="polite"
        aria-label="Conversation history"
      >
        <div className="mt-auto flex flex-col gap-4">
          {messages.map((message) => (
            <div key={message.id} className={`message-enter flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[88%] text-sm leading-6 sm:text-base ${message.role === "user" ? "rounded-2xl rounded-br-md border border-white/15 bg-white/[0.11] px-4 py-3 text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md" : "px-2 py-1 text-white/65"}`}>
                {message.text}
              </p>
            </div>
          ))}
          {isSending && <p className="ml-2 text-sm text-cyan-100/55 animate-pulse">Updating your context…</p>}
        </div>
      </div>

      <section className="chat-glass absolute inset-x-3 bottom-3 z-30 mx-auto max-w-3xl rounded-[26px] border border-white/[0.14] p-2.5 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:inset-x-6 sm:bottom-6 sm:p-3">
        {showExamples && (
          <div className="mb-2 flex flex-wrap gap-2 px-1 pt-0.5">
            {demoPrompts.map((prompt, index) => (
              <button
                key={prompt}
                type="button"
                disabled={isSending}
                onClick={() => void sendMessage(prompt)}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-left text-[11px] text-white/55 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white/85 disabled:opacity-40 sm:text-xs"
              >
                {index === 0 ? "Education" : "Career goal"}
              </button>
            ))}
            <span className="ml-auto self-center pr-1 text-[10px] uppercase tracking-[0.15em] text-white/25">Local demo</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-[19px] border border-white/[0.07] bg-black/25 p-1.5 sm:gap-3 sm:p-2">
          <label htmlFor="chat-message" className="sr-only">Your message</label>
          <textarea
            id="chat-message"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me something worth remembering…"
            disabled={isSending}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-5 text-white outline-none placeholder:text-white/35 disabled:opacity-50 sm:min-h-12 sm:px-4 sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            aria-label="Send message"
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition hover:scale-[1.04] hover:bg-cyan-100 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25 sm:h-11 sm:w-11"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M12 19V5m0 0L6 11m6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p className="hidden px-3 pt-2 text-[10px] tracking-wide text-white/25 sm:block">Enter to send <span className="px-1">·</span> Shift+Enter for a new line</p>
      </section>
    </main>
  );
}
