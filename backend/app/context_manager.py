"""Context window manager with token budget and compression."""

import os
import re
import uuid
from dataclasses import asdict, dataclass, field

from google import genai


@dataclass
class ContextItem:
    """A single item in the context window."""

    id: str
    type: str  # system_prompt | user_message | assistant_message | memory | summary
    text: str  # short display label
    content: str  # full content
    token_count: int
    turn_added: int
    status: str = "active"  # active | compressed
    # Memory-specific
    category: str | None = None
    relationship: str | None = None
    # Summary-specific
    compressed_from: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        return {k: v for k, v in d.items() if v is not None}


class ContextManager:
    """Manages a simulated context window with a token budget.

    Tracks all context items (messages, memories, summaries), estimates their
    token cost, and compresses older messages when the budget is exceeded.
    Returns snapshots of the full context state for the frontend to render.
    """

    def __init__(self, gemini_client: genai.Client | None = None, max_tokens: int = 300) -> None:
        self.gemini = gemini_client
        self.max_tokens = max_tokens
        self.items: dict[str, ContextItem] = {}
        self.current_turn = 0

        # Add system prompt as the first context item
        system_text = (
            "You are a helpful AI assistant. The user is chatting with you "
            "while visualizing your context window — they can see everything "
            "you have access to. Chat naturally and concisely."
        )
        self._add_item(
            item_type="system_prompt",
            text="System Prompt",
            content=system_text,
            turn=0,
        )

    def set_client(self, client: genai.Client | None) -> None:
        self.gemini = client

    def set_max_tokens(self, tokens: int) -> None:
        self.max_tokens = max(50, tokens)

    # ------------------------------------------------------------------
    # Token estimation
    # ------------------------------------------------------------------

    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimate: ~4 characters per token."""
        return max(1, len(text) // 4)

    @property
    def active_tokens(self) -> int:
        return sum(
            item.token_count
            for item in self.items.values()
            if item.status == "active"
        )

    # ------------------------------------------------------------------
    # Adding items
    # ------------------------------------------------------------------

    def _add_item(
        self,
        item_type: str,
        text: str,
        content: str,
        turn: int,
        **kwargs: object,
    ) -> ContextItem:
        item_id = str(kwargs.pop("item_id", f"{item_type}_{uuid.uuid4().hex[:8]}"))
        item = ContextItem(
            id=item_id,
            type=item_type,
            text=text,
            content=content,
            token_count=self._estimate_tokens(content),
            turn_added=turn,
            **kwargs,  # type: ignore[arg-type]
        )
        self.items[item_id] = item
        return item

    def add_user_message(self, content: str) -> ContextItem:
        self.current_turn += 1
        label = content[:50] + ("\u2026" if len(content) > 50 else "")
        return self._add_item("user_message", label, content, self.current_turn)

    def add_assistant_message(self, content: str) -> ContextItem:
        label = content[:50] + ("\u2026" if len(content) > 50 else "")
        return self._add_item("assistant_message", label, content, self.current_turn)

    def add_memory(
        self,
        memory_id: str,
        text: str,
        category: str,
        relationship: str,
        source: str,
    ) -> ContextItem:
        return self._add_item(
            "memory",
            text,
            f"{text} ({source})",
            self.current_turn,
            item_id=memory_id,
            category=category,
            relationship=relationship,
        )

    def delete_memory(self, memory_id: str) -> bool:
        if memory_id in self.items and self.items[memory_id].type == "memory":
            del self.items[memory_id]
            return True
        return False

    # ------------------------------------------------------------------
    # Compression
    # ------------------------------------------------------------------

    def _active_items_by_type(self, *item_types: str) -> list[ContextItem]:
        return sorted(
            [
                i
                for i in self.items.values()
                if i.type in item_types and i.status == "active"
            ],
            key=lambda i: i.turn_added,
        )

    def compress_if_needed(self) -> None:
        """Compress oldest messages if the token budget is exceeded."""
        while self.active_tokens > self.max_tokens:
            messages = self._active_items_by_type(
                "user_message", "assistant_message"
            )

            # Keep at least the last exchange (2 messages)
            if len(messages) <= 2:
                break

            # Compress oldest messages
            count = min(4, len(messages) - 2)
            if count % 2 == 1:
                count -= 1
            if count < 2:
                break

            to_compress = messages[:count]
            conversation_text = "\n".join(
                f"{'User' if i.type == 'user_message' else 'Assistant'}: {i.content}"
                for i in to_compress
            )

            summary_text: str = ""
            if self.gemini is not None:
                candidate_models = [
                    os.environ.get("GEMINI_MODEL", "gemini-3.6-flash"),
                    "gemini-3.8-flash",
                    "gemini-3-flash-preview",
                ]
                for model_name in candidate_models:
                    try:
                        response = self.gemini.models.generate_content(
                            model=model_name,
                            contents=f"Summarize this conversation excerpt in 1 concise sentence:\n\n{conversation_text}",
                            config={"automatic_function_calling": {"disable": True}},
                        )
                        summary_text = response.text.strip()
                        if summary_text:
                            break
                    except Exception:
                        continue

            if not summary_text:
                summary_text = f"Prior discussion covering: {', '.join(i.text for i in to_compress[:2])}."

            # Mark originals as compressed
            compressed_ids: list[str] = []
            for item in to_compress:
                item.status = "compressed"
                compressed_ids.append(item.id)

            # Add summary item
            turns = [i.turn_added for i in to_compress]
            self._add_item(
                "summary",
                f"Summary (turns {min(turns)}\u2013{max(turns)})",
                summary_text,
                self.current_turn,
                compressed_from=compressed_ids,
            )

    # ------------------------------------------------------------------
    # Building prompts for Gemini
    # ------------------------------------------------------------------

    def build_system_instruction(self) -> str:
        """Build the system instruction with memories, summaries, and schema."""
        parts: list[str] = [
            "You are a helpful AI assistant. The user is chatting with you "
            "while visualizing your context window — they can see everything "
            "you have access to. Chat naturally and concisely."
        ]

        # Summaries of compressed conversation
        summaries = self._active_items_by_type("summary")
        if summaries:
            parts.append("\nPrevious conversation context:")
            for s in summaries:
                parts.append(f"- {s.content}")

        # Active memories
        memories = self._active_items_by_type("memory")
        if memories:
            parts.append("\nKnown facts about the user:")
            for m in memories:
                parts.append(f"- {m.text} ({m.category})")

        parts.append(
            "\nTask Instructions:\n"
            "1. Give a natural, helpful reply to the user's latest message.\n"
            "2. Extract any durable facts about the user as memories. Valid categories are: 'Profile', 'Education', 'Goals'.\n"
            "3. Generate a stable snake_case ID starting with 'memory_' (e.g. 'memory_computer_engineering').\n"
            "4. Relationship should be a verb or short phrase (e.g. 'studies', 'attends', 'career goal', 'lives in').\n"
            "5. Do NOT re-extract facts already known.\n"
            "6. You MUST respond with ONLY a valid JSON object matching this schema:\n"
            "{\n"
            '  "reply": "Your conversational response",\n'
            '  "new_memories": [\n'
            '    {\n'
            '      "id": "memory_example",\n'
            '      "text": "Fact text",\n'
            '      "category": "Education",\n'
            '      "relationship": "studies"\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        return "\n".join(parts)

    def build_conversation(self) -> list[dict]:
        """Build the conversation messages for the Gemini API call."""
        messages: list[dict] = []
        for item in sorted(self.items.values(), key=lambda i: i.turn_added):
            if item.status != "active":
                continue
            if item.type == "user_message":
                messages.append({"role": "user", "parts": [{"text": item.content}]})
            elif item.type == "assistant_message":
                messages.append({"role": "model", "parts": [{"text": item.content}]})
        return messages

    # ------------------------------------------------------------------
    # Snapshot for frontend
    # ------------------------------------------------------------------

    def get_snapshot(self) -> dict:
        """Return the full context state for the frontend."""
        all_items = sorted(
            self.items.values(), key=lambda i: (i.turn_added, i.type)
        )

        # Build links: each item connects to the "user" anchor node
        links: list[dict] = []
        for item in all_items:
            if item.status not in ("active", "compressed"):
                continue

            relationship = {
                "system_prompt": "instructs",
                "user_message": f"turn {item.turn_added}",
                "assistant_message": f"replied turn {item.turn_added}",
                "memory": item.relationship or "related to",
                "summary": "summarized",
            }.get(item.type, "related")

            links.append(
                {
                    "source": "user",
                    "target": item.id,
                    "relationship": relationship,
                }
            )

        return {
            "items": [i.to_dict() for i in all_items],
            "links": links,
            "total_tokens": self.active_tokens,
            "max_tokens": self.max_tokens,
            "current_turn": self.current_turn,
        }
