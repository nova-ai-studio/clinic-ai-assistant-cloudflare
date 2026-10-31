// Chat orchestration. The model answers only from the clinic knowledge base, through two search tools:
// semantic_search (Vectorize, by meaning) and keyword_search (exact words). It books appointments
// with three more: check_availability, show_booking_form and book_appointment.
// Tools are offered in order: keyword_search after semantic_search, show_booking_form after
// check_availability, book_appointment only when the visitor has submitted the booking form.
//
// Tool calls and their results live only inside one request. The next turn's history holds just the
// question and answer texts, so old passages never pile up in the context window.

import {
  clinicNow,
  dayLabel,
  dentistName,
  DENTIST_IDS,
  freeSlots,
  isDate,
  isFree,
  isService,
  newRef,
  parseSlot,
  SERVICE_IDS,
  SERVICES,
  addDays,
  type Booking,
  type Held,
  type PartOfDay,
  type ServiceId,
  type Slot,
} from "./booking";
import { chunkText } from "./chunker";
import { HANDBOOK_CHUNKS, handbookTitle } from "./handbook";
import { BASE_SCOPE, toChunks, type Lang } from "./knowledge";
import { chatCompletion, embed, type ChatMessage, type ToolDefinition } from "./openai";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

/** A knowledge-base row a tool put into the model's context. */
export interface Hit {
  id: string;
  title: string;
  category: string;
  /** semantic_search: cosine similarity, 0–1. */
  score?: number;
  /** keyword_search: the keywords found in the row. */
  matched?: string[];
}

/** One tool call, as shown in the UI; `ms` is how long the tool took. */
export type Step = (
  | { tool: "semantic_search"; query: string; lang: Lang; hits: Hit[] }
  | { tool: "keyword_search"; keywords: string[]; lang: Lang; hits: Hit[] }
  | { tool: "check_availability"; service: ServiceId; from: string; to: string; dentist?: string; partOfDay?: PartOfDay; slots: Slot[] }
  | { tool: "show_booking_form"; service: ServiceId; slots: Slot[] }
  | { tool: "book_appointment"; booking?: Booking; error?: string }
) & { ms?: number };

/** Streamed to the page while a reply is being made: tool calls as they start and finish, answer text as it is written. */
export type ChatEvent =
  | { type: "tool"; id: string; tool: string; args: Record<string, unknown> }
  | { type: "step"; id: string; step: Step | null }
  | { type: "delta"; text: string }
  | { type: "reset" };

/** One tool call as the model made it: the raw arguments, and exactly what the code sent back to the model. */
export interface TraceCall {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  ms: number;
}

/** One model call: the tools it was offered, its text, the tools it called (in its order), and the timings. */
export interface TraceRound {
  offered: string[];
  toolChoice: "auto" | "none";
  modelMs: number;
  text: string;
  calls: TraceCall[];
  /** Wall time of the round's tool calls, which run in parallel. */
  toolsMs: number;
}

/** Everything one turn sent to the model and got back, for the trace view. */
export interface Trace {
  /** Chat model that writes the answers, and the embedding model semantic_search embeds queries with. */
  model: string;
  embeddingModel: string;
  reasoningEffort: "none";
  system: string;
  /** Earlier messages sent before the question: their texts only. */
  history: HistoryTurn[];
  rounds: TraceRound[];
  ms: number;
}

/** The booking form the model chose to show; the page renders it under the answer. */
export interface BookingFormUI {
  service: ServiceId;
  lang: Lang;
  slots: Slot[];
}

const TOP_K = 4;
const MAX_TOP_K = 20; // Vectorize limit when returning metadata
const MIN_SCORE = 0.3; // below this, a match is treated as unrelated
const MAX_TOOL_ROUNDS = 4;
const MAX_KEYWORDS = 6;
const MAX_KEYWORD_CHARS = 60;
const GET_BY_IDS_BATCH = 20;
const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 31;
const SLOTS_PER_DAY = 6;
const DAYS_PER_ANSWER = 5;
const MAX_FORM_SLOTS = 6;
// gpt-6-luna supports function calling in Chat Completions only with reasoning off.
const REASONING_EFFORT = "none";

const SYSTEM_PROMPT = `You are the assistant of Lumière Dental Clinic in Montréal.

Rules:
- Use only facts from your search results, never outside knowledge. No medical diagnoses; for urgent symptoms, give the clinic's emergency guidance.
- Reply in the language of the user's last message (en or fr), and search in that language.
- Small talk (hello, thanks, bye): reply in one or two warm sentences, without searching.

Style: warm and under about 90 words. Open with one sentence giving the key fact in **bold**, then bullets that each start with a bold label, e.g. "- **In-office:** $450, about 90 minutes", then one short next step (one emoji at most). No headings, tables or links.

Search, for every question about the clinic or dental care, even if it was answered earlier:
1. semantic_search with a standalone query ("and for kids?" → "whitening price for children"); one search per part of the question.
2. If the results miss the answer, try once more: other wording, or keyword_search for exact names, brands, codes or numbers.
3. Still nothing: say so and give the phone number **(514) 555-0142**. Never guess.

Booking:
1. check_availability for the service (ask which one if unclear; severe pain → "emergency").
2. show_booking_form with up to 6 free times spread over days, then reply in one sentence. Never list the times or ask for personal details: the form does both.
3. book_appointment once the user has submitted the form, then confirm the reference, date, time and dentist, and the text reminder 48 hours before.
- If the time was just taken, check again and show new times. To cancel or move an appointment: give the phone number and search the cancellation policy.`;

const LANG_PARAM = { type: "string", enum: ["en", "fr"], description: "Language of the user's message." };

const SEMANTIC_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "semantic_search",
    description:
      "Step 1 for every clinic question. Searches the clinic knowledge base by meaning (vector similarity), so it finds passages even when they use other words than the user. Returns up to 4 passages with a similarity score from 0 to 1 (higher is closer); passages under 0.3 are left out as unrelated. If the results are not promising, call it again with different wording, or use keyword_search.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The user's question, rewritten to stand alone, e.g. 'teeth whitening price for children', not 'and for kids?'.",
        },
        lang: LANG_PARAM,
      },
      required: ["query", "lang"],
      additionalProperties: false,
    },
  },
};

const KEYWORD_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "keyword_search",
    description:
      "Only after semantic_search. Finds passages that contain the exact words given (whole words; case and accents are ignored). Use it when the question names something specific that semantic_search did not return: a person, a brand or product, an insurer, a day, a price or a code. Returns up to 4 passages with the words each one matched.",
    parameters: {
      type: "object",
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: `1 to ${MAX_KEYWORDS} exact words or short phrases that must appear, e.g. ["Invisalign"] or ["Sun Life", "Manulife"]. Add spelling variants when useful ("x-ray", "x-rays").`,
        },
        lang: LANG_PARAM,
      },
      required: ["keywords", "lang"],
      additionalProperties: false,
    },
  },
};

const SERVICE_PARAM = {
  type: "string",
  enum: SERVICE_IDS,
  description: SERVICE_IDS.map((id) => `${id} = ${SERVICES[id].en} (${SERVICES[id].minutes} min)`).join("; "),
};
const SLOT_ITEMS = {
  type: "object",
  properties: {
    date: { type: "string", description: "YYYY-MM-DD" },
    time: { type: "string", description: "HH:MM, 24-hour" },
    dentist: { type: "string", enum: DENTIST_IDS },
  },
  required: ["date", "time", "dentist"],
  additionalProperties: false,
};

const AVAILABILITY_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "check_availability",
    description:
      "Step 1 of booking. Lists the free appointment times for a service, from the clinic's live schedule (Montréal time). Returns up to 5 days with free times, up to 6 times per day, each with its dentist.",
    parameters: {
      type: "object",
      properties: {
        service: SERVICE_PARAM,
        date_from: { type: "string", description: "First day to check, YYYY-MM-DD. Default: today." },
        date_to: { type: "string", description: `Last day to check, YYYY-MM-DD. Default: ${DEFAULT_RANGE_DAYS} days after date_from.` },
        dentist: {
          type: "string",
          enum: DENTIST_IDS,
          description: "Only if the user asked for a dentist: tremblay = Dr. Camille Tremblay, haddad = Dr. Omar Haddad, nguyen = Dr. Sofia Nguyen.",
        },
        part_of_day: { type: "string", enum: ["morning", "afternoon", "evening"], description: "Only if the user asked for one." },
      },
      required: ["service"],
      additionalProperties: false,
    },
  },
};

const FORM_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "show_booking_form",
    description:
      "Step 2 of booking, only after check_availability. Shows a booking form under your reply: the user picks one of the times you give and enters their name, phone, email and notes. Never collect those details in the chat.",
    parameters: {
      type: "object",
      properties: {
        service: SERVICE_PARAM,
        slots: { type: "array", items: SLOT_ITEMS, description: `1 to ${MAX_FORM_SLOTS} free times returned by check_availability.` },
        lang: LANG_PARAM,
      },
      required: ["service", "slots", "lang"],
      additionalProperties: false,
    },
  },
};

const BOOK_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "book_appointment",
    description:
      "Step 3 of booking. Books the time and patient details the user just submitted in the booking form. Returns the booking reference, or why it failed.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
};

export interface SessionView {
  sessionId?: string;
  /** Shared vectors (e.g. "services-whitening-en") this visitor deleted or replaced in their session. */
  hidden: Set<string>;
  /** Vector ids of the rows this visitor embedded in their session. */
  own: string[];
  /** Appointments booked earlier in this session. */
  held: Held[];
  /** The booking form submitted with this message, if any. */
  form?: Omit<Booking, "ref">;
}

interface Passage {
  id: string;
  title: string;
  category: string;
  text: string;
}

/**
 * Searches the shared base data plus the rows this visitor added in their own session,
 * minus the shared rows they deleted (over-fetched, then filtered out by id).
 */
async function semanticSearch(env: Env, query: string, lang: Lang, view: SessionView) {
  const [vector] = await embed(env.OPENAI_API_KEY, env.EMBEDDING_MODEL, [query]);
  const result = await env.VECTORIZE.query(vector, {
    topK: Math.min(MAX_TOP_K, TOP_K + view.hidden.size),
    returnMetadata: "all",
    filter: { lang, scope: view.sessionId ? { $in: [BASE_SCOPE, view.sessionId] } : BASE_SCOPE },
  });
  return result.matches
    .filter((m) => !view.hidden.has(m.id))
    .slice(0, TOP_K)
    .filter((m) => m.score >= MIN_SCORE && m.metadata)
    .map((m) => ({
      id: m.id,
      title: String(m.metadata!.title),
      category: String(m.metadata!.category),
      text: String(m.metadata!.text),
      score: Math.round(m.score * 1000) / 1000,
    }));
}

/** The same passages semantic search can reach: shared rows not hidden, the handbook chunks, and this visitor's embedded rows. */
async function keywordCorpus(env: Env, lang: Lang, view: SessionView): Promise<Passage[]> {
  const base = toChunks().filter((c) => c.lang === lang && !view.hidden.has(c.id));
  const own: Passage[] = [];
  const ids = view.sessionId ? view.own.filter((id) => id.endsWith(`-${lang}`)) : [];
  for (let i = 0; i < ids.length; i += GET_BY_IDS_BATCH) {
    for (const v of await env.VECTORIZE.getByIds(ids.slice(i, i + GET_BY_IDS_BATCH))) {
      const m = v.metadata;
      if (m && m.scope === view.sessionId && m.lang === lang) {
        own.push({ id: v.id, title: String(m.title), category: String(m.category), text: String(m.text) });
      }
    }
  }
  const handbook = HANDBOOK_CHUNKS.filter((c) => c.lang === lang).map((c) => ({ id: c.id, title: handbookTitle(c), category: "handbook", text: chunkText(c) }));
  return [...base, ...handbook, ...own];
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Whole-word, case- and accent-insensitive match; rows matching more keywords rank first. */
function keywordSearch(passages: Passage[], keywords: string[]) {
  const patterns = keywords.map((k) => {
    const escaped = fold(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return { k, re: new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u") };
  });
  return passages
    .map((p) => {
      const title = fold(p.title);
      const text = fold(p.text);
      const matched = patterns.filter(({ re }) => re.test(title) || re.test(text)).map(({ k }) => k);
      const inTitle = patterns.some(({ re }) => re.test(title));
      return { ...p, matched, inTitle };
    })
    .filter((p) => p.matched.length)
    .sort((a, b) => b.matched.length - a.matched.length || Number(b.inTitle) - Number(a.inTitle))
    .slice(0, TOP_K)
    .map(({ inTitle: _inTitle, ...p }) => p);
}

function parseJson(raw: string): Record<string, unknown> {
  try {
    const args = JSON.parse(raw);
    return args && typeof args === "object" ? args : {};
  } catch {
    return {};
  }
}

function parseKeywords(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((k): k is string => typeof k === "string" && !!k.trim())
    .map((k) => k.trim().slice(0, MAX_KEYWORD_CHARS))
    .slice(0, MAX_KEYWORDS);
}

/** The free times given to the model: the first days with openings, a few times spread over each day. */
function summarizeSlots(slots: Slot[]) {
  const byDay = new Map<string, Slot[]>();
  for (const s of slots) byDay.set(s.date, [...(byDay.get(s.date) ?? []), s]);
  const days = [...byDay].slice(0, DAYS_PER_ANSWER).map(([date, list]) => {
    const step = Math.max(1, list.length / SLOTS_PER_DAY);
    const picked = Array.from({ length: Math.min(SLOTS_PER_DAY, list.length) }, (_, i) => list[Math.floor(i * step)]);
    return { date, picked };
  });
  return {
    shown: days.flatMap((d) => d.picked),
    forModel: days.map(({ date, picked }) => ({
      date,
      day: dayLabel(date, "en"),
      times: picked.map((s) => ({ time: s.time, dentist: s.dentist, dentist_name: dentistName(s.dentist) })),
    })),
    moreDays: byDay.size > DAYS_PER_ANSWER,
  };
}

const describeSlot = (s: Slot) => `${dayLabel(s.date, "en")} at ${s.time} with ${dentistName(s.dentist)}`;

/** Every row any step returned, once, with its best score and all matched keywords. */
function mergeHits(steps: Step[]): Hit[] {
  const byId = new Map<string, Hit>();
  for (const hit of steps.flatMap((s) => ("hits" in s ? s.hits : []))) {
    const prev = byId.get(hit.id);
    if (!prev) {
      byId.set(hit.id, { ...hit });
      continue;
    }
    if (hit.score !== undefined) prev.score = Math.max(prev.score ?? 0, hit.score);
    if (hit.matched) prev.matched = [...new Set([...(prev.matched ?? []), ...hit.matched])];
  }
  return [...byId.values()];
}

export async function runChat(
  env: Env,
  message: string,
  history: HistoryTurn[],
  view: SessionView = { hidden: new Set(), own: [], held: [] },
  onEvent: (event: ChatEvent) => void = () => {},
): Promise<{ answer: string; steps: Step[]; sources: Hit[]; form?: BookingFormUI; booking?: Booking; trace: Trace }> {
  const turnStarted = Date.now();
  const now = clinicNow();
  const context = [
    `Now at the clinic: ${now.label} (Montréal time).`,
    view.held.length
      ? `Appointments booked in this chat: ${view.held
          .map((b) => `${b.ref}: ${SERVICES[b.service].en}, ${describeSlot(b)}`)
          .join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
    ...history,
    { role: "user", content: message },
  ];
  const steps: Step[] = [];
  const held = [...view.held];
  let corpus: Promise<Passage[]> | undefined;
  let form: BookingFormUI | undefined;
  let booking: Booking | undefined;
  const trace: Trace = { model: env.CHAT_MODEL, embeddingModel: env.EMBEDDING_MODEL, reasoningEffort: REASONING_EFFORT, system: messages[0].content as string, history, rounds: [], ms: 0 };
  const ran = (tool: Step["tool"]) => steps.some((s) => s.tool === tool);
  const done = (answer: string) => {
    trace.ms = Date.now() - turnStarted;
    return { answer, steps, sources: mergeHits(steps), form, booking, trace };
  };

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const isLastRound = round === MAX_TOOL_ROUNDS;
    // The order is enforced, not only asked for: each follow-up tool is offered once its first step ran.
    const offered = [SEMANTIC_TOOL, AVAILABILITY_TOOL];
    if (ran("semantic_search")) offered.splice(1, 0, KEYWORD_TOOL);
    if (ran("check_availability")) offered.push(FORM_TOOL);
    if (view.form && !booking) offered.push(BOOK_TOOL);

    const started = Date.now();
    let wroteText = false;
    const toolChoice = isLastRound ? "none" : "auto";
    const reply = await chatCompletion(
      env.OPENAI_API_KEY,
      { model: env.CHAT_MODEL, messages, tools: offered, tool_choice: toolChoice, reasoning_effort: REASONING_EFFORT },
      (text) => {
        wroteText = true;
        onEvent({ type: "delta", text });
      },
    );
    const traced: TraceRound = {
      offered: offered.map((t) => t.function.name),
      toolChoice,
      modelMs: Date.now() - started,
      text: reply.content?.trim() || "",
      calls: [],
      toolsMs: 0,
    };
    trace.rounds.push(traced);

    if (!reply.tool_calls?.length) return done(traced.text);
    // Text written before tool calls is not the answer: the page clears it.
    if (wroteText) onEvent({ type: "reset" });

    messages.push({ role: "assistant", content: reply.content, tool_calls: reply.tool_calls });
    const runTool = async (name: string, args: Record<string, unknown>): Promise<{ step?: Step; content: unknown }> => {
      const lang: Lang = args.lang === "fr" ? "fr" : "en";
      let content: unknown;
      let step: Step | undefined;

      if (!offered.some((t) => t.function.name === name)) {
        content = { error: `${name} is not available at this step. Follow the order in your instructions.` };
      } else if (name === "semantic_search") {
        const query = typeof args.query === "string" ? args.query.trim().slice(0, 500) : "";
        const hits = query ? await semanticSearch(env, query, lang, view) : [];
        step = { tool: "semantic_search", query, lang, hits: hits.map(({ text: _text, ...h }) => h) };
        content = hits.length
          ? hits.map(({ title, text, score }) => ({ title, text, score }))
          : { results: [], note: `No passage scored above ${MIN_SCORE}. Try different wording, or keyword_search for an exact term.` };
      } else if (name === "keyword_search") {
        const keywords = parseKeywords(args.keywords);
        corpus ??= keywordCorpus(env, lang, view);
        const hits = keywords.length ? keywordSearch(await corpus, keywords) : [];
        step = { tool: "keyword_search", keywords, lang, hits: hits.map(({ text: _text, ...h }) => h) };
        content = hits.length
          ? hits.map(({ title, text, matched }) => ({ title, text, matched }))
          : { results: [], note: "No passage contains these words." };
      } else if (name === "check_availability") {
        const service: ServiceId = isService(args.service) ? args.service : "checkup";
        const from = isDate(args.date_from) && args.date_from > now.date ? args.date_from : now.date;
        const maxTo = addDays(from, MAX_RANGE_DAYS);
        const to = isDate(args.date_to) && args.date_to >= from ? (args.date_to > maxTo ? maxTo : args.date_to) : addDays(from, DEFAULT_RANGE_DAYS);
        const dentist = typeof args.dentist === "string" && DENTIST_IDS.includes(args.dentist) ? args.dentist : undefined;
        const partOfDay = ["morning", "afternoon", "evening"].includes(args.part_of_day as string) ? (args.part_of_day as PartOfDay) : undefined;
        const summary = summarizeSlots(freeSlots(service, from, to, held, { dentist, partOfDay, now }));
        step = { tool: "check_availability", service, from, to, dentist, partOfDay, slots: summary.shown };
        content = summary.forModel.length
          ? { service: `${SERVICES[service].en} (${SERVICES[service].minutes} min)`, days: summary.forModel, more_days_available: summary.moreDays }
          : { days: [], note: `No free time for ${SERVICES[service].en} between ${from} and ${to}. Try later dates or another dentist.` };
      } else if (name === "show_booking_form") {
        const service: ServiceId = isService(args.service) ? args.service : "checkup";
        const slots = (Array.isArray(args.slots) ? args.slots : [])
          .map(parseSlot)
          .filter((s): s is Slot => !!s && isFree(service, s, held))
          .slice(0, MAX_FORM_SLOTS);
        if (slots.length) {
          form = { service, lang, slots };
          step = { tool: "show_booking_form", service, slots };
          content = { shown: true, times: slots.length, note: "The form with these times is under your reply. Reply in one short sentence asking the user to pick a time and fill it in; do not list the times." };
        } else {
          content = { shown: false, error: "None of these times is free. Call check_availability and use times it returned." };
        }
      } else {
        // book_appointment: the details come from the submitted form, never from the model.
        const f = view.form!;
        if (isFree(f.service, f, held)) {
          booking = { ...f, ref: newRef() };
          held.push(booking);
          step = { tool: "book_appointment", booking };
          content = { booked: true, reference: booking.ref, service: SERVICES[f.service].en, when: describeSlot(f), patient_first_name: f.name.split(" ")[0] };
        } else {
          const error = "That time was just taken.";
          step = { tool: "book_appointment", error };
          content = { booked: false, error: `${error} Call check_availability for ${f.service} and show the form again.` };
        }
      }
      return { step, content };
    };

    // Calls from one reply are independent, so they run in parallel; results keep the model's order.
    const toolsStarted = Date.now();
    const results = await Promise.all(
      reply.tool_calls.map(async (call) => {
        const args = parseJson(call.function.arguments);
        onEvent({ type: "tool", id: call.id, tool: call.function.name, args });
        const started = Date.now();
        const { step, content } = await runTool(call.function.name, args);
        const ms = Date.now() - started;
        const timed = step && { ...step, ms };
        onEvent({ type: "step", id: call.id, step: timed ?? null });
        return { call, args, content, ms, step: timed };
      }),
    );
    traced.toolsMs = Date.now() - toolsStarted;
    for (const { call, args, step, content, ms } of results) {
      if (step) steps.push(step);
      traced.calls.push({ tool: call.function.name, args, result: content, ms });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(content) });
    }
  }

  // Unreachable: the last round forces tool_choice "none".
  return done("");
}
