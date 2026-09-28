import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, Field

from app.context_manager import ContextManager

# Search for .env files in backend/ and repository root
backend_dir = Path(__file__).resolve().parent.parent
repo_root = backend_dir.parent
load_dotenv(backend_dir / ".env")
load_dotenv(repo_root / ".env")
load_dotenv()

app = FastAPI(title="context-visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_gemini_client() -> genai.Client | None:
    """Retrieve Gemini client if valid GEMINI_API_KEY is configured."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key or key == "your-api-key-here":
        return None
    return genai.Client(api_key=key)


# Initialize context manager with 300 token budget for responsive demo visualization
initial_client = get_gemini_client()
context = ContextManager(gemini_client=initial_client, max_tokens=300)


# --- Schemas for Turn response ---
class MemoryItem(BaseModel):
    """A durable fact about the user."""

    id: str = Field(description="Stable snake_case ID prefixed with memory_, e.g. memory_computer_engineering")
    text: str = Field(description="Concise label, 2-5 words")
    category: str = Field(description="Exactly one of: Profile, Education, Goals")
    relationship: str = Field(description="Verb or short phrase, e.g. studies, attends, career goal, lives in")


class TurnResponse(BaseModel):
    """Combined conversational reply + memory extraction from one Gemini call."""

    reply: str = Field(description="Your natural conversational response to the user")
    new_memories: list[MemoryItem] = Field(
        default=[],
        description="New durable facts extracted from the user's latest message. Empty if none found.",
    )


# --- Request models ---
class MessageRequest(BaseModel):
    message: str


class BudgetRequest(BaseModel):
    max_tokens: int


def parse_gemini_json(text: str) -> dict:
    """Safely parse JSON response from Gemini, removing markdown code blocks if present."""
    clean = text.strip()
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:json)?\s*", "", clean)
        clean = re.sub(r"\s*```$", "", clean)
    return json.loads(clean)


@app.get("/health")
def health_check() -> dict[str, object]:
    has_key = bool(os.environ.get("GEMINI_API_KEY", "").strip() and os.environ.get("GEMINI_API_KEY") != "your-api-key-here")
    return {"status": "ok", "gemini_configured": has_key, "max_tokens": context.max_tokens}


@app.get("/context")
def get_context() -> dict:
    """Return the current context snapshot (for initial page load)."""
    return context.get_snapshot()


@app.post("/budget")
def update_budget(request: BudgetRequest) -> dict:
    """Dynamically adjust the token budget and re-evaluate compression."""
    context.set_max_tokens(request.max_tokens)
    context.compress_if_needed()
    return context.get_snapshot()


@app.post("/messages")
def handle_message(request: MessageRequest) -> dict:
    # 1. Add user message to context
    context.add_user_message(request.message)

    # 2. Check client and compress if needed
    client = get_gemini_client()
    context.set_client(client)
    context.compress_if_needed()

    # 3. Call Gemini directly
    parsed: TurnResponse | None = None
    last_error: Exception | None = None

    if client is not None:
        candidate_models = [
            "gemini-3-flash-preview",
            "gemini-3.8-flash",
            "gemini-3.6-flash",
        ]

        system_instruction = context.build_system_instruction()
        conversation = context.build_conversation()

        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=conversation,
                    config={
                        "system_instruction": system_instruction,
                        "automatic_function_calling": {"disable": True},
                    },
                )
                raw_data = parse_gemini_json(response.text)
                new_mems = [MemoryItem(**m) for m in raw_data.get("new_memories", [])]
                parsed = TurnResponse(
                    reply=str(raw_data.get("reply", "Understood!")),
                    new_memories=new_mems,
                )
                break
            except Exception as exc:
                last_error = exc
                continue

    if parsed is None:
        if last_error is not None:
            err_str = str(last_error)
            if "503" in err_str:
                error_msg = "Google Gemini free tier is temporarily experiencing high traffic (503). Please retry in a few seconds."
            elif "429" in err_str:
                error_msg = "Gemini API rate limit reached. Please wait a moment before sending another message."
            else:
                error_msg = f"Gemini API error: {err_str[:120]}"
            parsed = TurnResponse(reply=f"⚠️ {error_msg}", new_memories=[])
        else:
            parsed = TurnResponse(
                reply="⚠️ Gemini API Key not found. Please set GEMINI_API_KEY in backend/.env to chat with Gemini.",
                new_memories=[],
            )

    # 4. Add assistant reply to context
    context.add_assistant_message(parsed.reply)

    # 5. Add newly extracted memories to context
    for mem in parsed.new_memories:
        if mem.id not in context.items:
            context.add_memory(
                memory_id=mem.id,
                text=mem.text,
                category=mem.category,
                relationship=mem.relationship,
                source=request.message,
            )

    # 6. Return reply + full context snapshot
    return {
        "reply": parsed.reply,
        "context": context.get_snapshot(),
    }


@app.delete("/memories/{memory_id}")
def delete_memory(memory_id: str) -> dict:
    if not context.delete_memory(memory_id):
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "deleted", "id": memory_id, "context": context.get_snapshot()}
