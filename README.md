# Lumière Dental — AI Assistant

A bilingual (English / French) AI assistant for a **fictional** dental clinic, running on Cloudflare Workers. It answers questions only from the clinic's knowledge base (stored in **Cloudflare Vectorize**), shows the sources behind every answer, and books appointments through a form it shows in the chat.

**Live demo:** https://dental-assistant.bilal-dev-ai.workers.dev

## Features

- **Grounded answers in EN and FR.** The assistant replies in the user's language, using only facts from the knowledge base. When the data doesn't cover a question, it says so and gives the clinic's phone number.
- **Live tool calls.** Replies stream: each tool call appears while it runs, the rows it uses light up in the side panel, then the answer is written word by word. Clicking a step afterwards highlights the rows or time slots it used.
- **Follow-up questions.** "And for kids?" is rewritten into a standalone search using the conversation so far.
- **Appointment booking.** The assistant checks the clinic's schedule, offers free times in a booking form, and books the slot once the form is submitted.
- **Live knowledge base.** The side panel shows every entry as tables. Visitors can add, edit and delete rows or whole tables, then click **Embed**. Their changes apply to their own session only.
- **Bookings view.** The panel lists the appointments booked in the chat and the free times per service, week by week.
- **Responsive.** Two-pane layout on desktop, full-screen drawers on mobile.

## Stack

| Concern | Tech |
| --- | --- |
| Runtime, API and hosting | Cloudflare Workers (TypeScript) |
| UI | Static HTML/CSS/JS served by Workers Static Assets (no build step), Inter and JetBrains Mono from Google Fonts |
| Vector database | Cloudflare Vectorize (`dental-kb`, 1536 dims, cosine) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Chat model | OpenAI `gpt-4o-mini` (`CHAT_MODEL` in `wrangler.jsonc`) |

## How the assistant works

```
 Browser ── POST /chat ──▶ Worker ──▶ gpt-4o-mini, with tools
                                │
          ┌─────────────────────┼──────────────────────────────┐
          │ knowledge           │                              │ booking
          ▼                     ▼                              ▼
   semantic_search ──▶ keyword_search            check_availability ──▶ show_booking_form
   (Vectorize, by       (exact words,                (clinic schedule)      (form in the chat)
    meaning)             accents ignored)                                         │
                                                                     user submits ▼
                                                                         book_appointment
```

| Tool | Offered | Returns |
| --- | --- | --- |
| `semantic_search(query, lang)` | always | up to 4 passages with similarity ≥ 0.3 |
| `keyword_search(keywords, lang)` | after a `semantic_search` | up to 4 passages containing the exact words |
| `check_availability(service, dates?, dentist?, part_of_day?)` | always | free times, up to 5 days × 6 times |
| `show_booking_form(service, slots, lang)` | after a `check_availability` | shows a form with up to 6 times |
| `book_appointment()` | only when the user has submitted the form | booking reference |

- **Tool order is enforced** by the Worker, not just requested in the prompt: a tool is only offered once the step before it has run.
- **Each reply can make up to 4 rounds of tool calls.** Calls the model makes in the same round run in parallel.
- **Patient details** (name, phone, email) go from the form straight to the booking. They are never sent to the model.
- **History holds only text.** It keeps the question and answer texts of the last 20 messages; tool calls and passages are not carried into later turns. Every question runs a fresh search, so edits to the knowledge base are used right away.
- **Nothing is stored on the server.** History and bookings live in page memory, so a reload starts a new session. Other patients' appointments are simulated deterministically, so the schedule looks realistic and stays stable.

### Visitor edits

Rows a visitor embeds are stored in the same index with `scope = <session id>` (a random id per page load). Searches filter on `scope IN ("base", <session id>)`, so each visitor sees the shared data plus their own rows, and nobody else's.

- **Deleting or editing a shared row** hides that vector for the session only; an edited row is saved as the visitor's own copy.
- **Saving takes about 1–2 s:** all rows in one click are embedded in a single OpenAI request and written in one Vectorize upsert.
- **Searchable after about 1–2 minutes,** whatever the batch size, because Vectorize indexes writes in the background. Each new row shows **Indexing** until a real search returns it (checked through `/embed/status`), then **Embedded**. Deletes apply at once.

## Project structure

```
public/index.html   Chat UI, knowledge-base panel, bookings view
src/index.ts        Routes and request validation
src/chat.ts         System prompt, tools, tool-calling loop
src/booking.ts      Clinic schedule, free slots, bookings
src/session-kb.ts   Visitor rows: embedding, upserts, indexing status
src/knowledge.ts    Knowledge base (each topic = one EN and one FR vector)
src/openai.ts       Minimal fetch-based OpenAI client
wrangler.jsonc      Worker, assets and Vectorize configuration
```

## API

| Route | Body | Returns |
| --- | --- | --- |
| `POST /chat` | `message`, `history[]`, `stream?`, `sessionId?`, `hidden?[]`, `own?[]`, `bookings?[]`, `bookingForm?` | `{ answer, steps[], sources[], form?, booking? }` |
| `GET /knowledge` | — | knowledge-base entries, bookable services, dentists |
| `POST /availability` | `service`, `from?`, `bookings?[]` | free times for 7 days, closed days |
| `POST /embed` | `sessionId`, `upsert[]`, `remove[]` | `{ upserted, removed, rev }` |
| `POST /embed/status` | `sessionId`, `ids[]`, `rev` | `{ ready }` |
| `POST /seed` | header `Authorization: Bearer <ADMIN_TOKEN>` | `{ upserted }` |

- **`/chat` steps:** `steps` lists every tool call in order, with its arguments, what it returned and its duration (`ms`).
- **`/chat` streaming:** with `"stream": true`, the reply is newline-delimited JSON events: `tool` (a call starts), `step` (it returned), `delta` (answer text), `reset` (discard text written before a tool call), then `done` with the full result, or `error`.
- **Server timings:** `/embed` and non-streaming `/chat` send per-phase durations in the `Server-Timing` header.
- **Session limits:** visitor row ids must start with `s-<sessionId>-`, with at most 20 upserts per call.
- **Seeding:** `/seed` upserts, so running it again never creates duplicates.

## Setup

```bash
npm install
npx wrangler login

# Vectorize index; create the metadata indexes before inserting vectors
npx wrangler vectorize create dental-kb --dimensions=1536 --metric=cosine
npx wrangler vectorize create-metadata-index dental-kb --property-name=lang --type=string
npx wrangler vectorize create-metadata-index dental-kb --property-name=category --type=string
npx wrangler vectorize create-metadata-index dental-kb --property-name=scope --type=string

# Secrets
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ADMIN_TOKEN

npm run deploy

# Load the knowledge base (run again after editing src/knowledge.ts)
curl -X POST https://<your-worker>.workers.dev/seed -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Local development

```bash
cp .dev.vars.example .dev.vars   # fill in OPENAI_API_KEY and ADMIN_TOKEN
npm run dev                      # uses the remote Vectorize index ("remote": true in wrangler.jsonc)
npm run typecheck
```
