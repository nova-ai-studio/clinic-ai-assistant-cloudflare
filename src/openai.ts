// Minimal OpenAI REST client (fetch only, no SDK) for embeddings and chat completions.

const API = "https://api.openai.com/v1";

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function post<T>(apiKey: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new OpenAIError(`OpenAI ${path} failed (${res.status}): ${detail.slice(0, 300)}`, res.status);
  }
  return res.json() as Promise<T>;
}

/** Embeds one or many texts in a single request; output order matches input order. */
export async function embed(apiKey: string, model: string, input: string[]): Promise<number[][]> {
  const data = await post<{ data: { index: number; embedding: number[] }[] }>(apiKey, "/embeddings", {
    model,
    input,
  });
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/**
 * Chat completion with streaming: text is passed to `onText` as it is generated, and tool-call
 * fragments are joined back together. Returns the full message once the stream ends.
 */
export async function chatCompletion(
  apiKey: string,
  params: {
    model: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    tool_choice?: "auto" | "required" | "none";
    /** Reasoning models such as gpt-6-luna; tool calls in Chat Completions need "none". */
    reasoning_effort?: "none" | "low" | "medium" | "high";
    temperature?: number;
  },
  onText: (text: string) => void = () => {},
): Promise<{ content: string | null; tool_calls?: ToolCall[] }> {
  const res = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, stream: true }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text();
    throw new OpenAIError(`OpenAI /chat/completions failed (${res.status}): ${detail.slice(0, 300)}`, res.status);
  }

  let content = "";
  const calls: ToolCall[] = [];
  let buffer = "";
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:") || line === "data: [DONE]") continue;
      const delta = JSON.parse(line.slice(5)).choices?.[0]?.delta as
        | { content?: string; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] }
        | undefined;
      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        onText(delta.content);
      }
      for (const part of delta.tool_calls ?? []) {
        const call = (calls[part.index] ??= { id: "", type: "function", function: { name: "", arguments: "" } });
        if (part.id) call.id = part.id;
        if (part.function?.name) call.function.name += part.function.name;
        if (part.function?.arguments) call.function.arguments += part.function.arguments;
      }
    }
  }
  const toolCalls = calls.filter(Boolean);
  return { content: content || null, tool_calls: toolCalls.length ? toolCalls : undefined };
}
