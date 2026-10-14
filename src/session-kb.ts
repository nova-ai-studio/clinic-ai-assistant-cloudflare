// Rows a visitor adds in the dataset panel. They are embedded into the same Vectorize index
// with `scope = <sessionId>`, so only that visitor's searches can see them (see chat.ts).
// Keeping them per session stops one visitor's edits from changing everyone's answers.

import { embed } from "./openai";

const SESSION_RE = /^[a-z0-9]{16}$/;
const ID_RE = /^[a-z0-9-]{1,64}$/;
const MAX_UPSERTS = 20;
const MAX_REMOVES = 50;
const MAX_TITLE_CHARS = 200;
const MAX_TEXT_CHARS = 1500;
const MAX_CATEGORY_CHARS = 40;
const REV_RE = /^[a-z0-9]{1,16}$/;

interface SessionRow {
  id: string;
  category: string;
  title: string;
  text: string;
  lang: "en" | "fr";
}

export function isSessionId(value: unknown): value is string {
  return typeof value === "string" && SESSION_RE.test(value);
}

export function isOwnId(id: unknown, sessionId: string): id is string {
  return typeof id === "string" && ID_RE.test(id) && id.startsWith(`s-${sessionId}-`);
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v && v.length <= max ? v : null;
}

export function parseEmbedBody(
  body: unknown,
): { sessionId: string; upsert: SessionRow[]; remove: string[] } | string {
  if (!body || typeof body !== "object") return "Invalid JSON body.";
  const { sessionId, upsert = [], remove = [] } = body as Record<string, unknown>;
  if (!isSessionId(sessionId)) return "Invalid `sessionId`.";
  if (!Array.isArray(upsert) || upsert.length > MAX_UPSERTS) return `\`upsert\` must be an array of at most ${MAX_UPSERTS} rows.`;
  if (!Array.isArray(remove) || remove.length > MAX_REMOVES) return `\`remove\` must be an array of at most ${MAX_REMOVES} ids.`;
  if (!upsert.length && !remove.length) return "Nothing to embed.";

  const rows: SessionRow[] = [];
  for (const r of upsert as Record<string, unknown>[]) {
    const title = str(r?.title, MAX_TITLE_CHARS);
    const text = str(r?.text, MAX_TEXT_CHARS);
    const category = str(r?.category, MAX_CATEGORY_CHARS);
    if (!isOwnId(r?.id, sessionId) || !title || !text || !category || (r.lang !== "en" && r.lang !== "fr")) {
      return "Each row needs an id from this session, a category, a title, a text and a lang ('en' or 'fr').";
    }
    rows.push({ id: r.id as string, category, title, text, lang: r.lang });
  }
  if (!remove.every((id) => isOwnId(id, sessionId))) return "Only rows from this session can be removed.";
  return { sessionId, upsert: rows, remove: remove as string[] };
}

/**
 * Embeds and upserts the rows and deletes removed ones. Vectorize applies writes asynchronously,
 * so the response carries a `rev` the page polls with /embed/status until search can see them.
 */
export async function applySessionChanges(
  env: Env,
  { sessionId, upsert, remove }: { sessionId: string; upsert: SessionRow[]; remove: string[] },
): Promise<{ upserted: number; removed: number; rev: string; timings: Record<string, number> }> {
  const rev = Date.now().toString(36);
  const timings: Record<string, number> = {};
  const time = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      timings[name] = Date.now() - start;
    }
  };
  if (remove.length) await time("delete", () => env.VECTORIZE.deleteByIds(remove));
  if (!upsert.length) return { upserted: 0, removed: remove.length, rev, timings };

  // One embeddings request for all rows, then one upsert: Vectorize indexes the batch as a single mutation.
  const vectors = await time("embed", () => embed(env.OPENAI_API_KEY, env.EMBEDDING_MODEL, upsert.map((r) => `${r.title}\n${r.text}`)));
  await time("upsert", () => env.VECTORIZE.upsert(
    upsert.map((r, i) => ({
      id: r.id,
      values: vectors[i],
      metadata: { text: r.text, title: r.title, category: r.category, lang: r.lang, scope: sessionId, rev },
    })),
  ));
  return { upserted: upsert.length, removed: remove.length, rev, timings };
}

export function parseStatusBody(body: unknown): { sessionId: string; ids: string[]; rev: string } | string {
  const { sessionId, ids, rev } = (body ?? {}) as Record<string, unknown>;
  if (!isSessionId(sessionId)) return "Invalid `sessionId`.";
  if (!Array.isArray(ids) || !ids.length || ids.length > MAX_UPSERTS || !ids.every((id) => isOwnId(id, sessionId))) {
    return `\`ids\` must list 1 to ${MAX_UPSERTS} rows from this session.`;
  }
  if (typeof rev !== "string" || !REV_RE.test(rev)) return "Invalid `rev`.";
  return { sessionId, ids: ids as string[], rev };
}

/**
 * True once search returns every row with the given revision. Reading by id can see a write before
 * the search index does, so each row is checked with a real query using its own vector.
 */
export async function isIndexed(env: Env, { sessionId, ids, rev }: { sessionId: string; ids: string[]; rev: string }): Promise<boolean> {
  const stored = await env.VECTORIZE.getByIds(ids);
  if (stored.length !== ids.length || stored.some((v) => v.metadata?.rev !== rev || !v.values)) return false;
  const checks = await Promise.all(
    stored.map(async (v) => {
      const { matches } = await env.VECTORIZE.query(Array.from(v.values as ArrayLike<number>), {
        topK: 1,
        returnMetadata: "all",
        filter: { scope: sessionId },
      });
      return matches[0]?.id === v.id && matches[0].metadata?.rev === rev;
    }),
  );
  return checks.every(Boolean);
}
