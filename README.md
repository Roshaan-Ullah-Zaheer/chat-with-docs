<div align="center">

# 📄 DocChat — Chat with your Documents

**Upload PDFs, Word docs, or text files and ask questions in plain English. Every answer is grounded in your documents and cites the exact source — document name and page number — so you can trust it.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

### 🔗 [**Live Demo**](https://your-deployment.vercel.app) &nbsp;·&nbsp; built with retrieval-augmented generation (RAG)

</div>

---

## ✨ What it does

DocChat is a production-style **RAG (Retrieval-Augmented Generation)** application. Instead of answering from a model's general knowledge (which can hallucinate), it answers **only from the documents you upload** and shows **where each answer came from**.

- 📥 **Multi-format upload** — PDF, Word (`.docx`), and text (`.txt` / `.md`), several at once via drag-and-drop.
- 🔎 **Grounded answers** — questions are matched against your documents using semantic vector search; the model only sees the most relevant passages.
- 🧾 **Source citations** — every answer includes inline `[1]`, `[2]` markers and clickable source chips showing the **document name + page number**. Click a chip to read the exact passage the answer used.
- 💬 **Real-time streaming chat** — answers stream token-by-token in a clean, modern interface.
- 🔒 **Per-session isolation** — each visitor's documents live in their own vector namespace.
- 💸 **Runs on $0** — Google Gemini's free tier + free hosting tiers. No credit card required.

> 🎬 **[Try the live demo →](https://your-deployment.vercel.app)** — upload a document and ask it anything.

<!-- Screenshot added after deployment: ![DocChat — chat with citations](docs/screenshot-chat.png) -->


---

## 🏗️ Architecture

```mermaid
flowchart TD
    U([User]) -->|drag & drop files| UI[Next.js UI]
    U -->|asks a question| UI

    subgraph Ingest["Ingestion  -  /api/upload"]
        P[Parse PDF / DOCX / TXT<br/>keep page numbers] --> C[Chunk text<br/>with overlap]
        C --> E1[Embed chunks<br/>Gemini embeddings]
    end

    subgraph Query["Query  -  /api/chat"]
        E2[Embed question] --> S[Vector search<br/>top-k passages]
        S --> G[Gemini 2.5 Flash<br/>answer + inline citations]
    end

    UI -->|upload| Ingest
    E1 -->|upsert vectors + metadata| VDB[(Upstash Vector)]
    UI -->|question| Query
    VDB -->|nearest chunks| S
    G -->|streamed answer| UI
    S -->|sources: doc + page| UI
```

### How a question gets answered
1. **Embed the question** with Gemini (`gemini-embedding-001`, `RETRIEVAL_QUERY` task type).
2. **Search** the session's Upstash Vector namespace for the `top-k` most similar chunks (cosine similarity).
3. **Build a grounded prompt** containing only those numbered passages, with strict instructions: answer *only* from context, cite sources inline, and say "I couldn't find that" when the answer isn't present.
4. **Stream** the answer from `gemini-2.5-flash`, and stream the matched **sources** (document + page + snippet) to the UI as structured data parts that render as clickable citations.

---

## 🧰 Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) + React 19 | One deployable full-stack app |
| Language | **TypeScript** | Type-safe end to end |
| Styling | **Tailwind CSS v4** | Fast, consistent, modern UI |
| AI orchestration | **Vercel AI SDK v6** | Streaming, embeddings, provider-agnostic |
| LLM + embeddings | **Google Gemini** (2.5 Flash + embeddings) | Strong quality on a generous free tier |
| Vector database | **Upstash Vector** | Serverless, free tier, zero ops |
| Document parsing | **unpdf** (PDF), **mammoth** (DOCX) | Pure-JS, serverless-friendly |
| Hosting | **Vercel** | Free, single-command deploy |

> **Provider-agnostic by design.** The AI provider lives in one file ([`src/lib/ai.ts`](src/lib/ai.ts)). Swap Gemini for OpenAI or Anthropic by changing two lines — the rest of the app is untouched.

---

## 🚀 Run it locally

### 1. Prerequisites
- Node.js 18.18+ (Node 22 recommended)
- A free **Google Gemini API key** → https://aistudio.google.com/apikey
- A free **Upstash Vector** index → https://console.upstash.com/vector
  - **Dimensions: `768`** · **Metric: `COSINE`**

### 2. Setup
```bash
git clone <your-repo-url>
cd chat-with-docs
npm install

cp .env.example .env.local   # then paste your keys into .env.local
```

`.env.local`:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
UPSTASH_VECTOR_REST_URL=your_upstash_rest_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_rest_token
```

### 3. Develop
```bash
npm run dev      # http://localhost:3000
```

---

## ☁️ Deploy to Vercel (free)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the three environment variables from `.env.local` in **Project → Settings → Environment Variables**.
4. Deploy. Vercel gives you a live `https://….vercel.app` URL.

---

## 🎯 Skills demonstrated

- **Retrieval-Augmented Generation (RAG)** end to end: parsing → chunking → embeddings → vector search → grounded generation.
- **Trustworthy AI**: source attribution with document + page citations, and explicit "I don't know" behavior to prevent hallucination.
- **Streaming AI UX** with the Vercel AI SDK (token streaming + structured data parts for citations).
- **Full-stack TypeScript** on Next.js App Router with clean separation of concerns (`lib/` logic, `api/` routes, `components/` UI).
- **Serverless architecture** using managed free tiers (Gemini, Upstash, Vercel) — production-quality with zero infrastructure cost.
- **Pragmatic product design**: drag-and-drop upload, per-session isolation, responsive UI, graceful error handling.

---

## 📁 Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/route.ts      # parse -> chunk -> embed -> upsert
│   │   ├── chat/route.ts        # retrieve -> stream grounded answer + sources
│   │   └── documents/route.ts   # clear a session's documents
│   ├── page.tsx                 # app shell (session, upload, chat state)
│   └── layout.tsx
├── components/                  # Sidebar, Chat, MessageBubble, Sources, UploadZone...
└── lib/
    ├── ai.ts                    # provider config (swap models here)
    ├── vector.ts                # Upstash client + per-session namespaces
    ├── parse.ts                 # PDF / DOCX / TXT extraction (keeps page numbers)
    ├── chunk.ts                 # overlapping text chunking
    └── types.ts                 # shared types
```

---

## 📝 License

[MIT](LICENSE) — free to use, learn from, and build on.
