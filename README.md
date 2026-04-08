# VietFinance

VietFinance is a modern React + Vite frontend for a digital banking experience.  
It includes a landing page, authentication screens, and an AI chatbot interface.

## Tech Stack

- React 19
- React Router DOM 7
- Vite 8
- ESLint 9

## Features

- Marketing landing page with multiple sections
- Animated hero experience
- Login and register pages
- AI chatbot UI with quick suggestion prompts
- Route-based navigation using React Router

## Project Structure

```text
vietfinance/
├─ public/
├─ src/
│  ├─ assets/
│  ├─ components/
│  ├─ pages/
│  │  ├─ landingPage.jsx
│  │  ├─ loginPage.jsx
│  │  ├─ registerPage.jsx
│  │  └─ AIChatBot.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ index.html
├─ package.json
└─ vite.config.js
```

## Routes

- `/` → Landing page
- `/login` → Login page
- `/register` → Register page
- `/chat` → AI chatbot page

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – build production bundle
- `npm run preview` – preview built app locally
- `npm run lint` – run ESLint

## Notes

- This repository currently focuses on frontend UI and routing.
- Authentication and chatbot backend integration can be added in future iterations.

## Semantic document search (optional)

The “Browse Documents” page supports **semantic search** if documents have been indexed into `DocumentChunk` embeddings.

- Run the indexer:

```bash
node backend/scripts/indexDocuments.js
```

- The indexer requires an embeddings server (Ollama) running, because embeddings are produced via `OLLAMA_URL` / `EMBED_MODEL` in `backend/services/embedder.js`.
