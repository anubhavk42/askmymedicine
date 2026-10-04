<div align="center">

# AskMyMedicine 💊
### Ask everyday medicine questions — get answers only from verified leaflets and your doctor's care sheet

**▶️ [Try the live app](https://askmymedicine.ai.studio)** — runs in your browser, no install or sign-up needed.

</div>

### Try it in 1 minute

1. Open **[askmymedicine.ai.studio](https://askmymedicine.ai.studio)**.
2. In the left panel, click **Download 18 docs (.zip)**.
3. Drag that `.zip` into the **Drag & drop** box — the app chunks and embeds all 18 documents.
4. Tap an example question (e.g. *Missed Metformin*) or type your own, and watch the **Retrieval Inspector** on the right.

> ⚠️ **Not medical advice.** AskMyMedicine is a portfolio/test-bench project. It only repeats what is written in the uploaded documents. Always follow your doctor or pharmacist. In an emergency in India, call **112**.

## The problem

Millions of people in India take the same everyday medicines — metformin, a statin, a BP tablet, a thyroid tablet — for years. Small doubts come up all the time: *"I missed my evening dose, should I take two tomorrow?"*, *"Can I take ibuprofen for a headache with my diabetes medicines?"*. The answer is usually already written in the medicine leaflet or the doctor's care sheet, but nobody reads a 6-page leaflet at 10 pm.

General AI chatbots answer these questions instantly — but they answer from "the internet", can't tell you where the answer came from, and will happily guess a dose. For health questions, a confident wrong answer is worse than no answer.

## Who it's for

- **Primary:** Patients (and family members managing a parent's medicines) who take everyday prescription medicines and want quick, plain-English answers they can trust.
- **Secondary:** Product and AI builders who want to *see* how a RAG (Retrieval-Augmented Generation) system decides what to answer — every chunk, score and threshold is visible.
- **Explicitly not for:** Diagnosis, new prescriptions, or dose changes. The app refuses those by design.

## The key decision

The bet: **for medicine questions, trust comes from showing the source, not from sounding smart.** So the app answers *only* from 18 verified documents, cites the exact document, section and review date under every answer, and puts the doctor's care sheet above the general leaflet when the two differ.

## The trade-off

The hard choice was **refusing to answer** whenever the documents don't cover the question, instead of letting the model fill the gap with general knowledge. If zero chunks pass the similarity threshold, **the model is not even called** — the user gets *"I could not find that in the documents. Please ask your doctor or pharmacist."*

What that cost: the app says "I don't know" more often than a normal chatbot, which can feel less helpful. That is intentional — a missed answer sends the user to their doctor; a made-up dose could hurt them.

## What's in v1

| Feature | What it does |
|---|---|
| 💬 **Ask a question** | Plain-English answers (under ~120 words) grounded only in the retrieved document chunks |
| 📄 **Source on every answer** | `Source: <document>, <section>, reviewed <date>` + a tap-to-expand "See where this came from" panel |
| 🩺 **Doctor's care sheet mode** | Pick *Sheet A (diabetes & cholesterol)* or *Sheet B (BP & thyroid)* — care-sheet advice is shown first and marked as priority |
| 🚨 **Emergency routing** | Symptoms like trouble breathing, swollen face/throat or overdose trigger a red banner: *"Call 112 or go to the nearest hospital now"* |
| 🔍 **Retrieval Inspector** | Live view of every candidate chunk: raw cosine score, keyword boosts, and USED vs IGNORED against the threshold |
| 🎚️ **Tunable retrieval** | Top-K slider, similarity-threshold slider, and Hybrid search (keyword + vector) on/off |
| ✅ **Verification Tests tab** | One-click benchmark of 3 must-pass scenarios (missed metformin, ibuprofen + care sheet, azithromycin refusal) |
| 📊 **Insights tab** | Log of questions asked, medicines detected, answer type and 👍/👎 feedback, exportable as CSV |
| 📲 **Share on WhatsApp** | Share the question, answer and source with family in one tap |
| 🇮🇳 **Indian brand names & typos** | Understands *Crocin/Dolo*, *Glycomet*, *Ecosprin*, *Thyronorm* etc. and small spelling mistakes like *metfromin* |
| 🔠 **Large text mode** | Bigger text for older users |
| 📥 **Bring your own docs** | Drag & drop `.md` files or a `.zip`, re-ingest, or download the 18 sample docs |

## What's deliberately not in v1

- **No diagnosis or new medicine suggestions** — out of scope on purpose; the system prompt forbids it.
- **No login or cloud database** — documents, vectors and the insights log live in the browser (memory + `localStorage`). Clearing the browser clears them.
- **No Hindi or regional languages yet** — English only for v1.
- **No real patient data** — the two doctor's care sheets are clearly-labelled **samples**.

## How it works

```
18 Markdown docs ──► Chunking ──► Embeddings ──► Vector store (browser)
                     (by ## heading,  (Gemini        │
                      merge <40 words, embedding)     │
                      split >250 words)               ▼
Question ──► Embed ──► Cosine similarity + hybrid keyword boost ──► Threshold filter
                                                                      │
                     0 chunks pass? ──► Refuse, no model call         │
                     Emergency words? ──► Red 112 banner              │
                                                                      ▼
                          Gemini Flash + 9 safety rules ──► Answer + source citation
```

**Retrieval details**

- Each chunk is embedded as `<Medicine name>, <Section heading>: <text>` so the medicine context is never lost.
- **Hybrid search:** +0.25 boost when the query names the chunk's medicine, a small heading-match boost, and a medicine gate — once a medicine is named, only that medicine's leaflet (plus the selected care sheet) can be used, so asking about *omeprazole* won't pull in *pantoprazole*.
- When 2+ medicines are named, Top-K is raised automatically (up to 8) so both get covered.
- When a care sheet is selected, up to two of its chunks are kept at a lower 0.35 floor so the doctor's instructions are not missed.

**The 9 safety rules given to the model**

1. Answer **only** from the retrieved chunks — no outside knowledge.
2. End every answer with `Source: <document>, <section>, reviewed <date>`.
3. Never state a dose, timing or limit that isn't in the chunks.
4. If the leaflet and care sheet differ, show both, label them, and say the care sheet takes priority.
5. If 0 chunks pass the threshold, don't call the model — return the "could not find" message.
6. Emergency symptoms → *"This may be urgent. Call 112 or go to the nearest hospital now."*
7. No diagnosis, no unlisted medicines.
8. UK numbers (NHS 111, 999) are mapped to **112** for India.
9. Simple English, short sentences, under 120 words.

## Verification tests (built into the app)

| # | Question | Expected behaviour |
|---|---|---|
| 1 | *"I forgot my evening metformin. Should I take two tablets tomorrow morning?"* | Don't double the dose; skip the missed dose if it's nearly time for the next one |
| 2 | *"Can I take ibuprofen for my headache?"* (Care Sheet A selected) | Show both leaflet and care sheet; care sheet first, warning to avoid ibuprofen |
| 3 | *"What dose of azithromycin should I take for a sore throat?"* | No chunks pass → model not called → exact "could not find" refusal |

## Documents included (18)

**16 medicine leaflets (NHS UK):** Paracetamol, Metformin, Atorvastatin, Ibuprofen, Aspirin, Cetirizine, Omeprazole, Pantoprazole, Amlodipine, Losartan, Simvastatin, Levothyroxine, Amoxicillin, Lactulose, Folic Acid, Ferrous Fumarate.

**2 sample doctor's care sheets (India):**
- Sheet A — Diabetes & Cholesterol
- Sheet B — Blood Pressure & Thyroid

All files are in [`public/sample_docs/`](public/sample_docs). Leaflet content is adapted from NHS medicine pages (Open Government Licence).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Lucide icons, Motion |
| Backend | Express + Vite middleware (`server.ts`) — keeps the API key on the server |
| AI | Google GenAI SDK (`@google/genai`) |
| Embeddings | `gemini-embedding-2-preview` (fallback `text-embedding-004`; offline hash fallback if the API fails) |
| Generation | `gemini-3.8-flash` (fallbacks `gemini-flash-latest`, `gemini-3.1-flash-lite`) |
| Storage | In-memory + browser `localStorage` |
| Built & hosted with | Google AI Studio |

### Project structure

```
src/
├── components/   # TopBar, DocumentsColumn, ChatColumn, RetrievalInspector, TestsTab, InsightsTab
├── utils/        # ragPipeline.ts — chunking, scoring, hybrid boost, threshold logic
├── services/     # aiService.ts — calls the server for embeddings & generation
└── data/         # sampleDocuments.ts
public/sample_docs/   # the 18 source documents
server.ts             # Express API: /api/embed and /api/generate
```

## How I would measure it

**North star: % of answers marked "Yes, solved" in the *Did this solve your doubt?* feedback.** The whole bet is that a grounded, cited answer is useful enough to settle a real doubt.

Supporting metrics:

- **Grounded-answer rate** — % of answers that carry a valid source citation (should be ~100%).
- **Correct-refusal rate** — % of out-of-scope questions (like the azithromycin test) that are refused instead of guessed.
- **Not-found rate** — how often users hit "I could not find that". A high rate points to missing documents, not a model problem.
- **Verification test pass rate** — all 3 built-in tests must pass before any change ships.

## Known limits

- Answer quality has only been checked with the 3 built-in tests and hands-on use — no large, formal evaluation set yet.
- Leaflets are UK NHS documents; Indian dosages, strengths and pack sizes may differ. Brand-name mapping covers common brands only.
- Data lives only in the browser — no sync across devices.
- No automated test pipeline (CI) yet.

## Running it yourself

**You'll need:** [Node.js](https://nodejs.org) 18+ and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/anubhavk42/askmymedicine.git
cd askmymedicine
npm install
cp .env.example .env     # then set GEMINI_API_KEY in .env
npm run dev              # opens on http://localhost:3000
```

The app starts empty. Click **Download 18 docs (.zip)** and drop the zip back into the upload box (or upload your own `.md` files) to start asking questions.

## Development note

Built by [Anubhav Kapoor](https://www.linkedin.com/in/anubhav-kapoor-438b23197) (B.Pharm, PGDM SPJIMR) using AI-assisted development in [Google AI Studio](https://aistudio.google.com) with Gemini.
