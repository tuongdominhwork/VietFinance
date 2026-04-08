# VietFinance

VietFinance is a React + Vite SPA with an Express + Prisma (SQLite) backend.

It includes:
- a marketing landing page
- auth (login/register)
- a Documents browser with **permission-aware semantic search**
- an AI chatbot that can answer using the indexed documents (RAG), also permission-aware

## Tech Stack

### Frontend
- React 19
- React Router DOM 7
- Vite 8
- ESLint 9 (flat config)

### Backend
- Node.js + Express
- Prisma (SQLite)
- JWT auth
- Ollama for chat + embeddings
- `pdf-parse` for extracting text from uploaded PDFs

## Repo structure

```text
vietfinance/
├─ src/                      # React app
│  ├─ pages/AIChatBot.jsx     # Chat + Documents UI
│  ├─ utils/api.js            # API client (default: http://localhost:5001/api)
│  └─ index.css               # global styling
├─ backend/
│  ├─ server.js               # Express API
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ data/vietfinance.db  # SQLite DB (dev)
│  ├─ controllers/
│  ├─ routes/
│  ├─ services/               # chunking, embedding, vector search
│  └─ scripts/indexDocuments.js
└─ package.json               # frontend scripts
```

## Quick start (dev)

### 1) Install dependencies

```bash
npm install
cd backend && npm install
```

### 2) Configure backend environment

Create `backend/.env` (you can start from `backend/.env.example`) and ensure **the backend runs on port 5001** to match the frontend API client.

Minimal recommended dev config:

```bash
# backend/.env
PORT=5001
BASE_URL=http://localhost:5001

# Prisma (SQLite)
DATABASE_URL="file:./prisma/data/vietfinance.db"

# Auth
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Ollama (chat + embeddings)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b
EMBED_MODEL=nomic-embed-text
```

Notes:
- The frontend currently calls the API at `http://localhost:5001/api` (see `src/utils/api.js`).
- File download/preview URLs are built using `BASE_URL`, so keep `BASE_URL` consistent with `PORT`.

### 3) Prepare the database (Prisma)

```bash
cd backend
npm run db:generate
npm run db:push
```

Optional: seed dev data

```bash
cd backend
npm run seed
```

### 4) Start servers

Frontend:

```bash
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

## Frontend routes

- `/` → Landing page
- `/login` → Login page
- `/register` → Register page
- `/chat` → AI chatbot + Documents browser

## Documents

### Browse Documents API
- `GET /api/documents/folders` — permission-aware folder tree
- `GET /api/documents/folders/:id` — permission-aware folder contents
- `GET /api/documents/search?q=...` — permission-aware semantic search

### Semantic search (how it works)

Semantic search is implemented by:
- extracting PDF text (`pdf-parse`)
- chunking into overlapping chunks (`backend/services/chunker.js`)
- embedding each chunk with Ollama embeddings (`backend/services/embedder.js`)
- storing embeddings in `DocumentChunk`
- scoring query-vs-chunk cosine similarity (`backend/services/vectorSearch.js`)

#### Indexing (required for semantic search + chatbot RAG)

Run:

```bash
cd backend
npm run index
```

Re-index when:
- new documents are added/changed
- you change indexing/embedding logic (e.g., embedding title + content)
- you change embedding model (`EMBED_MODEL`)

You do NOT need to re-index just because you restarted the backend.

## Permission model (Documents + Chatbot)

Documents have a `permission` field: `admin | manager | employee | customer`.

Access rules (inclusive “at or below”):
- **admin**: can access `admin`, `manager`, `employee`, `customer`
- **manager**: can access `manager`, `employee`, `customer`
- **employee**: can access `employee`, `customer`
- **customer**: can access `customer`

Where enforced:
- Browse Documents folder tree + folder contents endpoints
- Semantic search endpoint
- Chatbot RAG retrieval (the chatbot will not leak restricted excerpts)

Chatbot behavior with restricted info:
- If the relevant information exists only in documents the user **cannot** access, the AI responds with a permission notice and asks the user to contact someone with access.

## AI Chatbot (RAG)

Chat endpoint:
- `POST /api/chats/:id/messages`

Behavior:
- The backend retrieves relevant document excerpts via semantic search.
- Excerpts are attached to the model prompt as a bounded “Document context” message.
- Chat history is included (bounded by `MAX_HISTORY_MESSAGES`).

Useful backend env vars:
- `MAX_HISTORY_MESSAGES` (default `20`)
- `MAX_CONTEXT_CHARS` (default `2500`)

## Scripts

### Frontend (repo root)
- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

### Backend (`backend/`)
- `npm run dev` — start API with nodemon
- `npm run start` — start API
- `npm run db:generate` — prisma generate
- `npm run db:push` — prisma db push
- `npm run seed` — seed database
- `npm run index` — index PDFs into `DocumentChunk` embeddings

## Troubleshooting

### “Semantic search works but chatbot says no excerpts found”
- Ensure you re-indexed after any indexing/embedding changes: `cd backend && npm run index`
- Ensure backend is restarted after code changes
- Check that Ollama is running (`OLLAMA_URL`) and the embedding model exists (`EMBED_MODEL`)

### Port mismatch / requests failing
- Frontend expects backend at `http://localhost:5001/api` (see `src/utils/api.js`)
- Ensure backend `PORT=5001` and `BASE_URL=http://localhost:5001`
