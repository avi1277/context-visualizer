# Backend handoff for context-visualizer

## Project state

The frontend is a Next.js app in `src/`. The current chat-to-memory behavior is a **temporary local mock** in `src/lib/mock-extraction.ts`; it does not call FastAPI or OpenAI. `src/components/ContextWorkspace.tsx` owns chat and memory state, while `src/components/MemoryGraph.tsx` renders the graph. Memories and deletions currently live only in browser state and reset on refresh.

The FastAPI scaffold is in `backend/app/main.py` and currently exposes only `GET /health`.

## Frontend data contract

The TypeScript types are in `src/lib/memories.ts`:

```ts
type MemoryCategory = "Profile" | "Education" | "Goals";

type MemoryNode = {
  id: string;
  text: string;
  category: MemoryCategory;
  source: string;
};

type MemoryLink = {
  source: string;
  target: string;
  relationship: string;
};
```

`userNode` is the graph's fixed anchor (`id: "user"`). Returned memories should connect to it with relationships such as `"studies"`, `"attends"`, or `"career goal"`.

## Suggested API contract

`POST /messages`

Request:

```json
{ "message": "I'm a sophomore studying Computer Engineering at Brown." }
```

Response:

```json
{
  "memories": [
    {
      "id": "memory_computer_engineering",
      "text": "Computer Engineering",
      "category": "Education",
      "source": "I'm a sophomore studying Computer Engineering at Brown."
    }
  ],
  "relationships": [
    {
      "source": "user",
      "target": "memory_computer_engineering",
      "relationship": "studies"
    }
  ]
}
```

Return only newly extracted memories so the frontend can append them to the graph. Keep this response shape aligned with `ExtractionResult` in `src/lib/mock-extraction.ts`.

## Backend tasks

1. Add Pydantic request and response models matching the contract.
2. Implement `POST /messages` and replace the mock extraction with OpenAI extraction.
3. Preserve the user's message as the `source` on each extracted memory.
4. Generate valid relationship endpoints that refer to the `user` anchor or returned memory IDs.
5. Add a delete-memory endpoint for the frontend's “Forget this memory” action.
6. Configure CORS for the local Next.js origin (`http://localhost:3000`).
7. Read `OPENAI_API_KEY` from the environment; do not commit a real key.

The MVP plan calls for in-memory JSON storage and excludes accounts and multi-user support. Coordinate the final route paths and response shape before the frontend replaces `extractMemoriesMock` with API calls.

## Running the backend

From the repository root:

```sh
backend/.venv/bin/uvicorn app.main:app --reload --app-dir backend
```

The frontend runs with `npm run dev` at `http://localhost:3000`.
