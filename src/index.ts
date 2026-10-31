import {
  addDays,
  clinicNow,
  DENTISTS,
  freeSlots,
  isDate,
  isOpenDay,
  isService,
  parseBookingForm,
  parseHeld,
  SERVICES,
} from "./booking";
import { runChat, type ChatEvent, type HistoryTurn, type SessionView } from "./chat";
import { chunkText, CHUNKING, embeddedText } from "./chunker";
import { HANDBOOK_CHUNKS, HANDBOOK_TITLE, handbookTitle } from "./handbook";
import { BASE_SCOPE, KNOWLEDGE, toChunks } from "./knowledge";
import { embed, OpenAIError } from "./openai";
import { applySessionChanges, isIndexed, isOwnId, isSessionId, parseEmbedBody, parseStatusBody } from "./session-kb";

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_CHARS = 4000;
const MAX_HIDDEN = 100;
const MAX_OWN = 200;
const AVAILABILITY_DAYS = 7;
const VECTOR_ID_RE = /^[a-z0-9-]{1,64}$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Constant-time string comparison, so the admin token can't be guessed byte by byte. */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}

async function handleSeed(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!env.ADMIN_TOKEN || !token || !(await safeEqual(token, env.ADMIN_TOKEN))) {
    return json({ error: "Unauthorized" }, 401);
  }

  // FAQ rows: title + text, so short questions ("hours?") match the topic name too.
  const rows = toChunks().map((c) => ({
    id: c.id,
    input: `${c.title}\n${c.text}`,
    metadata: { text: c.text, title: c.title, category: c.category, lang: c.lang, scope: BASE_SCOPE },
  }));
  // Handbook chunks: breadcrumb + text, so each chunk keeps the context of its headings.
  const docs = HANDBOOK_CHUNKS.map((c) => ({
    id: c.id,
    input: embeddedText(c),
    metadata: { text: chunkText(c), title: handbookTitle(c), category: "handbook", lang: c.lang, scope: BASE_SCOPE },
  }));
  const all = [...rows, ...docs];
  const vectors = await embed(env.OPENAI_API_KEY, env.EMBEDDING_MODEL, all.map((v) => v.input));
  await env.VECTORIZE.upsert(all.map(({ id, metadata }, i) => ({ id, values: vectors[i], metadata })));
  // Vectorize writes are async: new vectors become queryable after a few seconds.
  return json({ upserted: all.length, rows: rows.length, handbook: docs.length });
}

function parseChatBody(
  body: unknown,
): { message: string; history: HistoryTurn[]; view: SessionView } | string {
  if (!body || typeof body !== "object") return "Invalid JSON body.";
  const { message, history, sessionId, hidden = [], own = [], bookings, bookingForm } = body as Record<string, unknown>;
  if (sessionId !== undefined && !isSessionId(sessionId)) return "Invalid `sessionId`.";
  if (!Array.isArray(hidden) || hidden.length > MAX_HIDDEN || !hidden.every((id) => typeof id === "string" && VECTOR_ID_RE.test(id))) {
    return `\`hidden\` must be an array of at most ${MAX_HIDDEN} vector ids.`;
  }
  if (!Array.isArray(own) || own.length > MAX_OWN || (own.length && !sessionId) || !own.every((id) => isOwnId(id, sessionId as string))) {
    return `\`own\` must be an array of at most ${MAX_OWN} vector ids from this session.`;
  }
  const held = parseHeld(bookings);
  if (!held) return "`bookings` must be an array of at most 20 bookings.";
  const form = bookingForm === undefined ? undefined : parseBookingForm(bookingForm);
  if (typeof form === "string") return form;

  if (typeof message !== "string" || !message.trim()) return "`message` must be a non-empty string.";
  if (message.length > MAX_MESSAGE_CHARS) return `\`message\` must be at most ${MAX_MESSAGE_CHARS} characters.`;

  const turns: HistoryTurn[] = [];
  if (history !== undefined) {
    if (!Array.isArray(history)) return "`history` must be an array.";
    for (const t of history.slice(-MAX_HISTORY_TURNS)) {
      if (
        !t ||
        (t.role !== "user" && t.role !== "assistant") ||
        typeof t.content !== "string" ||
        t.content.length > MAX_HISTORY_CHARS
      ) {
        return "Each `history` item must be { role: 'user' | 'assistant', content: string }.";
      }
      turns.push({ role: t.role, content: t.content });
    }
  }
  return {
    message: message.trim(),
    history: turns,
    view: { sessionId, hidden: new Set(hidden as string[]), own: own as string[], held, form },
  };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

const UNAVAILABLE = "The assistant is temporarily unavailable. Please try again.";

async function handleChat(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = await readJson(request);
  const parsed = parseChatBody(body);
  if (typeof parsed === "string") return json({ error: parsed }, 400);

  // { stream: true }: newline-delimited JSON events, so the page can show each tool call live
  // and the answer as it is written, then a final "done" event with the full result.
  if ((body as { stream?: unknown }).stream === true) {
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const emit = (event: ChatEvent | Record<string, unknown>) => {
      writer.write(encoder.encode(`${JSON.stringify(event)}\n`)).catch(() => {});
    };
    ctx.waitUntil(
      (async () => {
        try {
          const result = await runChat(env, parsed.message, parsed.history, parsed.view, emit);
          emit({ type: "done", ...result });
        } catch (err) {
          console.error(err);
          emit({ type: "error", error: UNAVAILABLE });
        } finally {
          await writer.close().catch(() => {});
        }
      })(),
    );
    return new Response(readable, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const result = await runChat(env, parsed.message, parsed.history, parsed.view);
  const res = json(result);
  // Each model round and each tool call, visible in the browser's network panel.
  const timings = [
    ...result.trace.rounds.map((r, i) => `model-${i + 1};dur=${r.modelMs}`),
    ...result.steps.map((s, i) => `${s.tool}-${i + 1};dur=${s.ms ?? 0}`),
  ];
  res.headers.set("Server-Timing", timings.join(", "));
  return res;
}

/** Free times for one service over a week, for the bookings view. */
async function handleAvailability(request: Request): Promise<Response> {
  const body = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  const held = parseHeld(body.bookings);
  if (!isService(body.service) || !held) return json({ error: "Expected { service, from?, bookings? }." }, 400);
  const now = clinicNow();
  const from = isDate(body.from) && body.from > now.date ? body.from : now.date;
  const to = addDays(from, AVAILABILITY_DAYS - 1);
  const days = Array.from({ length: AVAILABILITY_DAYS }, (_, i) => addDays(from, i));
  return json({
    from,
    to,
    service: body.service,
    closed: days.filter((d) => !isOpenDay(d)),
    slots: freeSlots(body.service, from, to, held, { now }),
  });
}

async function handleEmbed(request: Request, env: Env): Promise<Response> {
  const parsed = parseEmbedBody(await readJson(request));
  if (typeof parsed === "string") return json({ error: parsed }, 400);

  const { timings, ...result } = await applySessionChanges(env, parsed);
  const res = json(result);
  // Per-phase durations (OpenAI embedding, Vectorize upsert/delete), visible in the browser's network panel.
  res.headers.set("Server-Timing", Object.entries(timings).map(([name, ms]) => `${name};dur=${ms}`).join(", "));
  return res;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);
    const route = `${request.method} ${pathname}`;

    try {
      if (route === "POST /chat") return await handleChat(request, env, ctx);
      if (route === "POST /seed") return await handleSeed(request, env);
      if (route === "POST /embed") return await handleEmbed(request, env);
      if (route === "POST /embed/status") {
        const parsed = parseStatusBody(await readJson(request));
        return typeof parsed === "string" ? json({ error: parsed }, 400) : json({ ready: await isIndexed(env, parsed) });
      }
      if (route === "POST /availability") return await handleAvailability(request);
      // The same content that /seed embeds, plus the bookable services, so the UI can show what the assistant knows.
      if (route === "GET /knowledge") {
        return json({
          entries: KNOWLEDGE,
          handbook: { title: HANDBOOK_TITLE, chunking: CHUNKING, chunks: HANDBOOK_CHUNKS },
          services: SERVICES,
          dentists: DENTISTS.map(({ id, name }) => ({ id, name })),
        });
      }
      if (["/chat", "/seed", "/embed", "/embed/status", "/knowledge", "/availability"].includes(pathname)) {
        return json({ error: "Method not allowed" }, 405);
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error(err);
      const status = err instanceof OpenAIError && err.status === 429 ? 503 : 500;
      return json({ error: UNAVAILABLE }, status);
    }
  },
} satisfies ExportedHandler<Env>;
