# context-visualizer
## Visualizing and Calibrating AI User Models

### Project Overview

**Team Size:** 2  
**Project Type:** Design + AI Research Lab Prototype  
**Target Build Time:** 4-6 Hours (Vibecoding)  
**Goal:** Build a live visualization showing how an AI constructs and updates its understanding of a user.

---

# Problem

Modern AI assistants build increasingly detailed models of users through conversation, but these models are largely invisible.

Users cannot easily answer:

| Question | Current State |
|-----------|-----------|
| What does the AI know about me? | Hidden |
| What assumptions has it made? | Hidden |
| Which facts are most important? | Hidden |
| What information is wrong? | Difficult to inspect |
| How can I correct it? | Limited control |

context-visualizer explores whether exposing this model improves user understanding and calibration.

---

# Core Idea

As a user chats with an AI:

1. Durable memories are extracted
2. Memories become graph nodes
3. Relationships become graph edges
4. Graph updates live
5. User can inspect and edit the AI's understanding

### Example

User:

> I'm a sophomore studying Computer Engineering at Brown.

Generated Memories:

| Memory | Category |
|----------|----------|
| Brown University | Education |
| Computer Engineering | Education |
| Sophomore | Education |

Graph immediately updates.

---

# Research Question

> How can AI memory be visualized to help users understand and calibrate an AI's model of them?

---

# MVP Scope

## Must Have

| Feature | Description |
|----------|----------|
| Chat Window | User enters messages |
| Memory Extraction | Extract durable user facts |
| Graph Visualization | Show memories as nodes |
| Live Updates | New nodes appear instantly |
| Node Inspector | Click node to view details |
| Delete Memory | Remove incorrect memories |

## Nice To Have

| Feature | Priority |
|----------|----------|
| Confidence Scores | Medium |
| Categories | Medium |
| Graph Animations | Medium |

## Out of Scope

- Authentication
- Accounts
- RAG
- Vector Databases
- Agent Frameworks
- Long-Term Memory Decay
- Multi-user Support
- Deployment

---

# Technical Architecture

```text
User
 │
 ▼
Chat Interface
 │
 ▼
OpenAI Memory Extraction
 │
 ▼
Memory Objects
 │
 ▼
Graph Generator
 │
 ▼
React Visualization
```

---

# Tech Stack

| Layer | Tool |
|---------|---------|
| Frontend | Next.js |
| Styling | Tailwind |
| Graph | react-force-graph-2d |
| Backend | FastAPI |
| AI | OpenAI API |
| Storage | In-Memory JSON |

---

# Memory Object Schema

```json
{
  "id": "memory_001",
  "text": "Computer Engineering",
  "category": "Education",
  "source": "I'm a sophomore studying Computer Engineering at Brown."
}
```

---

# Team Responsibilities

## Partner A

### Frontend + Visualization

- Chat UI
- Graph Rendering
- Node Styling
- Graph Animations
- Inspector Panel
- Delete Memory UI
- Demo Flow

### Deliverables

- Functional graph
- Interactive nodes
- Clean UI

---

## Partner B

### Backend + Memory System

- FastAPI
- OpenAI Integration
- Memory Extraction Prompt
- Memory Schema
- Relationship Generation
- Delete Memory Endpoint

### Deliverables

- Extracted memories
- API endpoints
- Memory generation pipeline

---

# Build Timeline

## Phase 0 — Planning (15 min)

| Task | Owner |
|---------|---------|
| Finalize MVP scope | A + B |
| Create GitHub repository | B |
| Create rough UI sketch | A |
| Define memory format | A + B |

### Deliverable

- Everyone agrees on MVP

---

## Phase 1 — Project Setup (45 min)

| Task | Owner |
|---------|---------|
| Create Next.js project | A |
| Install Tailwind | A |
| Install graph library | A |
| Create FastAPI project | B |
| Connect OpenAI API | B |
| Define memory schema | B |

### Deliverable

- Frontend and backend running locally

---

## Phase 2 — Graph Prototype (60 min)

| Task | Owner |
|---------|---------|
| Render mock graph | A |
| Add node labels | A |
| Add graph interactions | A |
| Create sample memory objects | B |
| Create relationship format | B |
| Create test API response | B |

### Deliverable

- Static graph visible in browser

---

## Phase 3 — Memory Extraction (60 min)

| Task | Owner |
|---------|---------|
| Build extraction prompt | B |
| Create extraction endpoint | B |
| Convert response to memory objects | B |
| Connect frontend to backend | A + B |
| Display extracted memories | A |

### Deliverable

- User message generates graph nodes

---

## Phase 4 — Live Updates (45 min)

| Task | Owner |
|---------|---------|
| Graph updates on new message | A |
| Node creation animations | A |
| Relationship generation | B |
| Source tracking | B |

### Deliverable

- Live memory graph

---

## Phase 5 — Inspection & Calibration (45 min)

| Task | Owner |
|---------|---------|
| Node click handling | A |
| Inspector panel | A |
| Delete memory endpoint | B |
| Delete memory logic | B |
| Graph refresh after deletion | A |

### Deliverable

- User can inspect and delete memories

---

## Phase 6 — Demo Polish (30 min)

| Task | Owner |
|---------|---------|
| UI cleanup | A |
| Prompt tuning | B |
| Bug fixes | A + B |
| Demo walkthrough | A + B |

### Deliverable

- Stable demo

---

# Demo Flow

## Step 1

User enters:

> I'm a sophomore studying Computer Engineering at Brown.

Graph creates:

- Brown University
- Computer Engineering
- Sophomore

---

## Step 2

User enters:

> I want to become a Product Manager.

Graph adds:

- Product Management

---

## Step 3

User clicks:

Computer Engineering

Inspector opens.

---

## Step 4

User deletes:

Product Management

Graph updates immediately.

---

# Success Criteria

The project is successful if:

- Memory extraction works
- Graph updates live
- Nodes can be inspected
- Nodes can be deleted
- Demo runs smoothly in under 2 minutes
