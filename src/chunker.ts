// Structure-aware chunking of a Markdown document, for embedding.
//
// 1. Split on headings: each "###" section (or "##" text before its first "###") is one topic.
// 2. A section that fits in maxTokens is one chunk.
// 3. A longer section is packed by paragraph and list item (by sentence if one is too long);
//    each next part starts with the last sentences of the part before it (the overlap), so a
//    fact cut at a boundary is still whole in one chunk.
// 4. A table is split by rows, never inside a row, and every part repeats the header row
//    instead of overlapping: a price without its column names is useless.
// 5. The text embedded is "breadcrumb\ntext", so a chunk keeps the context of its headings.

import type { Lang } from "./knowledge";

export const CHUNKING = {
  maxTokens: 200,
  overlapSentences: 2,
  overlapMaxTokens: 60,
};

export interface DocChunk {
  /** Vector id, e.g. "hb-4-2-1-en": section 4.2, part 1. */
  id: string;
  lang: Lang;
  /** Headings from the document title down, e.g. ["Patient Handbook", "4. Care after…", "4.2 After a wisdom tooth removal"]. */
  path: string[];
  part: number;
  parts: number;
  kind: "text" | "table";
  /** The sentences repeated from the previous part ("" for the first part and for tables). */
  overlap: string;
  /** The chunk's own text, after the overlap. */
  body: string;
  tokens: number;
}

/** About 4 characters per token for English and French: close enough to size chunks. */
export const estimateTokens = (s: string) => Math.ceil(s.length / 4);

export const breadcrumb = (c: DocChunk) => c.path.join(" › ");
/** The chunk as it is embedded and given to the model: its headings, then its text. */
export const chunkText = (c: DocChunk) => (c.overlap ? `${c.overlap}\n${c.body}` : c.body);
export const embeddedText = (c: DocChunk) => `${breadcrumb(c)}\n${chunkText(c)}`;

interface Section {
  path: string[];
  blocks: { kind: "text" | "table"; lines: string[] }[];
}

/** Headings open sections; blank lines separate paragraphs; "|" lines form tables; "- " lines are list items. */
function parseSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const path: string[] = [];
  let current: Section | null = null;
  let block: Section["blocks"][number] | null = null;

  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      path.length = level - 1;
      path[level - 1] = heading[2];
      current = level > 1 ? { path: [...path], blocks: [] } : null;
      if (current) sections.push(current);
      block = null;
      continue;
    }
    if (!line) {
      block = null;
      continue;
    }
    if (!current) continue;
    const kind = line.startsWith("|") ? "table" : "text";
    // Every list item and every paragraph is its own unit; table lines stay together.
    if (!block || block.kind !== kind || kind === "text") {
      block = { kind, lines: [] };
      current.blocks.push(block);
    }
    block.lines.push(line);
  }
  return sections.filter((s) => s.blocks.length);
}

// Ends at . ! or ? followed by a capital or digit, except after titles like "Dr.".
const sentences = (text: string) => text.split(/(?<=[.!?])(?<!\b(?:Dr|Dre)\.)\s+(?=[A-ZÀ-Ý«"(\d])/u);

/** Paragraphs and list items, or their sentences when one is too long for a part. */
function textUnits(lines: string[]): string[] {
  return lines.flatMap((l) => (estimateTokens(l) <= CHUNKING.maxTokens - CHUNKING.overlapMaxTokens ? [l] : sentences(l)));
}

/** The last sentences of a part, repeated at the start of the next one. */
function tailSentences(text: string): string {
  const all = text.split("\n").flatMap(sentences);
  const tail: string[] = [];
  for (let i = all.length - 1; i >= 0 && tail.length < CHUNKING.overlapSentences; i--) {
    const s = all[i].replace(/^-\s+/, "");
    if (estimateTokens([s, ...tail].join(" ")) > CHUNKING.overlapMaxTokens) break;
    tail.unshift(s);
  }
  return tail.join(" ");
}

/** Greedily packs units into parts of at most maxTokens. */
function pack(units: string[], sep: string, budget = CHUNKING.maxTokens): string[] {
  const parts: string[] = [];
  let cur: string[] = [];
  for (const u of units) {
    if (cur.length && estimateTokens([...cur, u].join(sep)) > budget) {
      parts.push(cur.join(sep));
      cur = [];
    }
    cur.push(u);
  }
  if (cur.length) parts.push(cur.join(sep));
  return parts;
}

function chunkSection(s: Section): Omit<DocChunk, "id" | "lang" | "part" | "parts">[] {
  const out: Omit<DocChunk, "id" | "lang" | "part" | "parts">[] = [];
  const text = s.blocks.filter((b) => b.kind === "text").flatMap((b) => b.lines);
  if (text.length) {
    // When the section must be split, each part leaves room for the overlap it may receive.
    const whole = text.join("\n");
    const bodies = estimateTokens(whole) <= CHUNKING.maxTokens ? [whole] : pack(textUnits(text), "\n", CHUNKING.maxTokens - CHUNKING.overlapMaxTokens);
    bodies.forEach((body, i) => {
      const overlap = i ? tailSentences(bodies[i - 1]) : "";
      out.push({ path: s.path, kind: "text", overlap, body, tokens: estimateTokens(overlap ? `${overlap}\n${body}` : body) });
    });
  }
  for (const t of s.blocks.filter((b) => b.kind === "table")) {
    const [header, divider, ...rows] = t.lines;
    const head = `${header}\n${divider}`;
    for (const group of pack(rows, "\n", CHUNKING.maxTokens - estimateTokens(head))) {
      const body = `${head}\n${group}`;
      out.push({ path: s.path, kind: "table", overlap: "", body, tokens: estimateTokens(body) });
    }
  }
  return out;
}

/** Chunks a Markdown document; ids are "<prefix>-<section number>-<part>-<lang>". */
export function chunkMarkdown(markdown: string, lang: Lang, prefix: string): DocChunk[] {
  return parseSections(markdown).flatMap((s) => {
    const number = /^(\d+(?:\.\d+)*)/.exec(s.path.at(-1) ?? "")?.[1] ?? "0";
    const parts = chunkSection(s);
    return parts.map((c, i) => ({
      ...c,
      id: `${prefix}-${number.replace(/\./g, "-")}-${i + 1}-${lang}`,
      lang,
      part: i + 1,
      parts: parts.length,
    }));
  });
}
