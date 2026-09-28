export type ContextItemType =
  | "system_prompt"
  | "user_message"
  | "assistant_message"
  | "memory"
  | "summary"
  | "user_anchor";

export type ContextItemStatus = "active" | "compressed";

export type MemoryCategory = "Profile" | "Education" | "Goals";

export type ContextItem = {
  id: string;
  type: ContextItemType;
  text: string;
  content: string;
  token_count: number;
  turn_added: number;
  status: ContextItemStatus;
  category?: MemoryCategory;
  relationship?: string;
  compressed_from?: string[];
};

export type ContextLink = {
  source: string;
  target: string;
  relationship: string;
};

export type ContextSnapshot = {
  items: ContextItem[];
  links: ContextLink[];
  total_tokens: number;
  max_tokens: number;
  current_turn: number;
};

export type MessageResponse = {
  reply: string;
  context: ContextSnapshot;
};

/** The fixed center node in the graph. */
export const userNode: ContextItem = {
  id: "user",
  type: "user_anchor",
  text: "You",
  content: "The person chatting with the assistant. All memories, conversation turns, and context elements connect to you.",
  token_count: 0,
  turn_added: 0,
  status: "active",
};

/** Color scheme for each context item type. */
export const typeColors: Record<ContextItemType, string> = {
  user_anchor: "#38bdf8",
  system_prompt: "#8b8fa3",
  user_message: "#60a5fa",
  assistant_message: "#a78bfa",
  memory: "#40edcf",
  summary: "#fbbf24",
};

/** Human-readable labels for context item types. */
export const typeLabels: Record<ContextItemType, string> = {
  user_anchor: "User Anchor",
  system_prompt: "System Prompt",
  user_message: "Your message",
  assistant_message: "AI reply",
  memory: "Memory",
  summary: "Summary",
};
