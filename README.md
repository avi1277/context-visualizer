# context-visualizer

A live visualization showing how an AI model constructs, compresses, and updates its active context window during a conversation.

## Features

- **Live Context Window Map**: Visualizes everything currently in the model's context window (User anchor, Messages, AI Replies, Extracted Memories, Summaries).
- **Token Budget & Compression**: Simulates the context window lifecycle. As active tokens approach the budget limit, older messages are compressed into summaries, fading on the graph to demonstrate "forgetting" in real time.
- **Durable Memory Extraction**: Automatically extracts persistent facts about the user (Education, Goals, Profile) and links them to the user node.
- **Node Inspector & Calibration**: Click any graph node to inspect its token count, turn added, and content. Delete memories directly to recalibrate what the AI knows.
- **Dual Mode**: Powered by **Google Gemini** (Free Tier via `google-genai`). Features a built-in fallback mode so the UI and graph operate smoothly even before an API key is configured.

## Architecture

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, `react-force-graph-2d`.
- **Backend**: FastAPI, Uvicorn, Python 3.11+, `google-genai` SDK, Pydantic v2.
- **AI Model**: Google Gemini (`gemini-2.0-flash` by default, configurable via `GEMINI_MODEL`).

## Quick Start

### 1. Backend Setup

From the repository root:

```bash
# Create virtual environment and install dependencies
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt

# (Optional but recommended) Configure your free Gemini API key:
cp backend/.env.example backend/.env
# Edit backend/.env and set:
# GEMINI_API_KEY=AIzaSy...

# Start the FastAPI server on http://localhost:8000
backend/.venv/bin/uvicorn app.main:app --reload --app-dir backend
```

> **Get a free Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/) -> **Get API Key** -> **Create API key** (no credit card required).

### 2. Frontend Setup

In a separate terminal:

```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Graph Legend

| Node Type | Color | Description |
|-----------|-------|-------------|
| **System** | Slate Gray | Base instructions framing the AI's behavior |
| **You** | White/Cyan Glow | Anchor node representing the user |
| **Messages** | Sky Blue | User input messages with turn count |
| **AI Replies** | Violet | Model responses |
| **Education** | Teal | Extracted schools, degrees, and academic standing |
| **Goals** | Orange | Career goals and aspirations |
| **Profile** | Indigo | Personal facts, location, hobbies |
| **Summaries** | Amber | Compressed history generated when token budget fills |
| *Compressed* | Faded (25% opacity) | Older messages that were compressed into a summary |
