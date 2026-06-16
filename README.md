<div align="center">

# 📄 DocChat — Chat with your Documents

**Upload PDFs, Word docs, or text files and ask questions in plain English. Every answer is grounded in your documents and cites the exact source — document name and page number — so you can trust it.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

### 🔗 [**Live Demo**](https://chat-with-docs-iota.vercel.app) &nbsp;·&nbsp; built with retrieval-augmented generation (RAG)

</div>

---

## ✨ What it does

DocChat is a production-style **RAG (Retrieval-Augmented Generation)** application. Instead of answering from a model's general knowledge (which can hallucinate), it answers **only from the documents you upload** and shows **where each answer came from**.

- 📥 **Multi-format upload** — PDF, Word (`.docx`), and text (`.txt` / `.md`), several at once via drag-and-drop.
- 🧠 **Smart onboarding** — the moment you upload, it shows an AI summary of the document and tailored starter questions.
- 🔎 **Grounded answers** — semantic vector search feeds the model only the most relevant passages; it answers *only* from your files, or says it couldn't find it.
- 🧾 **Clickable source citations** — inline `[1]`, `[2]` markers plus source chips showing **document name + page**. For PDFs, click a citation to open the **exact page with the passage highlighted**.
- 💬 **Live pipeline + follow-ups** — answers stream token-by-token with a visible retrieval pipeline, then suggest natural follow-up questions.
- 🛡️ **Resilient on free tiers** — a multi-key Gemini → Groq fallback chain keeps every feature working even when a key hits its daily limit.
- 🔒 **Per-session isolation** — each visitor's documents live in their own vector namespace.

> 🎬 **[Try the live demo →](https://chat-with-docs-iota.vercel.app)** — upload a document and ask it anything.

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/01-onboarding.png" alt="AI summary and tailored starter questions on upload"/><br/><sub><b>Smart onboarding</b> — an AI summary + tailored questions the moment you upload.</sub></td>
    <td width="50%"><img src="docs/02-grounded-answer.png" alt="Grounded answer with clickable inline citations"/><br/><sub><b>Grounded answers</b> — streamed token-by-token with clickable inline citations.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/03-sources-followups.png" alt="Sources showing document and page, plus suggested follow-ups"/><br/><sub><b>Sources &amp; follow-ups</b> — each answer shows its source document + page and suggests next questions.</sub></td>
    <td width="50%"><img src="docs/04-pdf-highlight.png" alt="PDF opened to the exact page with the passage highlighted"/><br/><sub><b>PDF source highlighting</b> — click a citation to open the exact page with the passage highlighted.</sub></td>
  </tr>
</table>

---

## 🏗️ Architecture

```mermaid
flowchart TD
    U([User]) -->|drag and drop files| UI[Next.js UI]
    U -->|asks a question| UI

    subgraph Ingest["Ingestion  -  /api/upload"]
        P[Parse PDF / DOCX / TXT<br/>keep page numbers] --> C[Chunk text<br/>with overlap]
        C --> E1[Embed chunks<br/>Gemini embeddings]
    end

    subgraph Query["Query  -  /api/chat"]
        E2[Embed question] --> S[Vector search<br/>top-k passages]
        S --> G[Gemini / Groq fallback<br/>answer + inline citations]
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
4. **Generate** the answer through the multi-key Gemini → Groq fallback chain, **streamed token-by-token**, alongside the matched **sources** (document + page + snippet) — sent to the UI as structured data parts that render as clickable citations.

---

## 🧰 Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) + React 19 | One deployable full-stack app |
| Language | **TypeScript** | Type-safe end to end |
| Styling | **Tailwind CSS v4** | Fast, consistent, modern UI |
| AI orchestration | **Vercel AI SDK v6** | Streaming, embeddings, provider-agnostic |
| LLM (answers) | **Google Gemini** (2.5 Flash → Flash-Lite) with **Groq** (Llama 3.3 70B) fallback | Multi-key, multi-model failover so the demo never breaks on free-tier limits |
| Embeddings | **Gemini** `gemini-embedding-001` (768-dim) across all keys | Strong retrieval quality, free |
| Vector database | **Upstash Vector** | Serverless, free tier, zero ops |
| Document parsing | **unpdf** (PDF), **mammoth** (DOCX) | Pure-JS, serverless-friendly |
| Hosting | **Vercel** | Free, single-command deploy |

> **Provider-agnostic & resilient by design.** All model calls live in one file ([`src/lib/ai.ts`](src/lib/ai.ts)) and run through a fallback chain: each Gemini key is tried with `gemini-2.5-flash` then `gemini-2.5-flash-lite`, across every key, then **Groq** as a last resort. If one key hits its free-tier limit, the next takes over automatically — so every feature keeps working.

---

## 🔑 Getting your free API keys

Everything below is **free** and needs **no credit card**.

### 1. Google Gemini — chat answers + embeddings
1. Go to **https://aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key → Create API key in new project**.
3. Copy the key (looks like `AIza…` or `AQ.…`).
4. *(Recommended)* Repeat with one or two **other** Google accounts. The app rotates through all of them, so more keys = more free headroom. Put them all in `GOOGLE_API_KEYS`, comma-separated.

### 2. Groq — answer fallback (when all Gemini keys are busy)
1. Go to **https://console.groq.com/keys** and sign up (Google/GitHub login).
2. Click **Create API Key**, name it, and copy it (looks like `gsk_…`).

### 3. Upstash Vector — the search database
1. Go to **https://console.upstash.com** and sign up (free).
2. Open the **Vector** tab → **Create Index**.
3. Set **Type: `Dense`**, **Embedding Model: `Custom`**, **Dimensions: `768`**, **Metric: `Cosine`**.
4. Open the index → **Connect / .env** and copy `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN`.

---

## 🚀 Run it locally

### 1. Prerequisites
- Node.js 18.18+ (Node 22 recommended)
- One or more free **Google Gemini API keys** → https://aistudio.google.com/apikey (add several, comma-separated, for automatic failover)
- A free **Groq API key** (final fallback for answers) → https://console.groq.com/keys
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
# One or more Gemini keys, comma-separated (tried in order, flash then flash-lite)
GOOGLE_API_KEYS=gemini_key_1,gemini_key_2,gemini_key_3
# Final fallback for answers when all Gemini keys are exhausted
GROQ_API_KEY=your_groq_key
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
3. Add the environment variables from `.env.local` (`GOOGLE_API_KEYS`, `GROQ_API_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`) in **Project → Settings → Environment Variables**.
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
    ├── ai.ts                    # multi-key Gemini -> Groq fallback chain
    ├── insights.ts              # AI document summaries + follow-up questions
    ├── vector.ts                # Upstash client + per-session namespaces
    ├── parse.ts                 # PDF / DOCX / TXT extraction (keeps page numbers)
    ├── chunk.ts                 # overlapping text chunking
    ├── session.ts               # per-browser session id handling
    └── types.ts                 # shared types
```

---

## 📝 License

[MIT](LICENSE) — free to use, learn from, and build on.
