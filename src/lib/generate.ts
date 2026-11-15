import type { ExamConfig } from "./types";

export interface StreamRequest {
  config: ExamConfig;
  code: string;
  mode?: "revise" | "variant";
  current?: string;
  revision?: string;
  signal: AbortSignal;
  onText: (raw: string) => void;
  onPhase: (phase: "thinking" | "writing") => void;
}

/**
 * Asks the server for a paper and reports the text as it is written.
 * Resolves with the full text; rejects with an Error whose message is an error code.
 */
export async function streamExam(req: StreamRequest): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-access-code": req.code },
      body: JSON.stringify({
        config: req.config,
        mode: req.mode,
        current: req.current,
        revision: req.revision,
      }),
      signal: req.signal,
    });
  } catch (err) {
    if (req.signal.aborted) throw err;
    throw new Error("network");
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.code === "string" ? body.code : "unknown");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let raw = "";
  let failure: string | null = null;
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      if (req.signal.aborted) throw err;
      throw new Error("network");
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line) continue;
      const event = JSON.parse(line);
      if (event.t === "delta") {
        raw += event.v;
        req.onText(raw);
      } else if (event.t === "phase") {
        req.onPhase(event.v);
      } else if (event.t === "reset") {
        raw = "";
        req.onText(raw);
      } else if (event.t === "error") {
        failure = event.code;
      }
    }
  }
  if (failure) throw new Error(failure);
  if (!raw.trim()) throw new Error("unknown");
  return raw;
}
