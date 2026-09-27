# context-visualizer

A prototype for making an AI's understanding of a user visible and editable.

## Project structure

- `src/app/` — Next.js app, page, and global styles
- `backend/app/` — FastAPI service
- `context-visualizer-project-plan.md` — product scope and technical plan

## Stack

- Next.js, React, TypeScript, and Tailwind CSS
- `react-force-graph-2d` for the memory graph
- FastAPI for the API
- OpenAI API for memory extraction
- In-memory JSON storage for the prototype

## Getting started

Use Node.js 20.9 or later. Install JavaScript dependencies with `npm install`, then run `npm run dev` and open `http://localhost:3000`.

The backend scaffold is in `backend/`. Its setup and API routes will be added in the next implementation step.
