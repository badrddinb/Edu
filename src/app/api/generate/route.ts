import Anthropic from "@anthropic-ai/sdk";
import { accessAllowed } from "@/lib/access";
import { SYSTEM_PROMPT, buildRevisionMessage, buildUserMessage } from "@/lib/prompt";
import { parseConfig } from "@/lib/validate";

export const dynamic = "force-dynamic";
// A full paper with its marking guide can take a few minutes to write.
export const maxDuration = 300;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

type StreamEvent =
  | { t: "phase"; v: "thinking" | "writing" }
  | { t: "delta"; v: string }
  | { t: "reset" }
  | { t: "done" }
  | { t: "error"; code: string };

const fail = (code: string, status: number) => Response.json({ code }, { status });

export async function POST(request: Request) {
  if (!accessAllowed(request)) return fail("bad_code", 401);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return fail("no_key", 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("invalid", 400);
  }
  const config = parseConfig(body.config);
  if (!config) return fail("invalid", 400);

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: buildUserMessage(config) },
  ];
  // Revision: replay the paper as it now stands (including the teacher's own
  // edits) and ask for the change.
  const revision = typeof body.revision === "string" ? body.revision.slice(0, 2000).trim() : "";
  const current = typeof body.current === "string" ? body.current.slice(0, 120_000).trim() : "";
  if (revision && current) {
    messages.push(
      { role: "assistant", content: current },
      { role: "user", content: buildRevisionMessage(revision) },
    );
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        const run = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 64000,
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            thinking: { type: "adaptive" },
            output_config: { effort: "high" },
            // If a safety classifier declines, the API retries on a fallback model.
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            messages,
          },
          { signal: request.signal },
        );

        for await (const event of run) {
          if (event.type === "content_block_start") {
            if (event.content_block.type === "thinking") send({ t: "phase", v: "thinking" });
            else if (event.content_block.type === "text") send({ t: "phase", v: "writing" });
            // A fallback model starts the answer over: drop any partial text.
            else if (event.content_block.type === "fallback") send({ t: "reset" });
          } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send({ t: "delta", v: event.delta.text });
          }
        }

        const final = await run.finalMessage();
        if (final.stop_reason === "refusal") send({ t: "error", code: "refusal" });
        else if (final.stop_reason === "max_tokens") send({ t: "error", code: "truncated" });
        else send({ t: "done" });
      } catch (err) {
        if (request.signal.aborted) return;
        console.error("generate failed:", err);
        send({ t: "error", code: errorCode(err) });
      } finally {
        try {
          controller.close();
        } catch {
          // The client already went away.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function errorCode(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "server_auth";
  if (err instanceof Anthropic.PermissionDeniedError) return "server_auth";
  if (err instanceof Anthropic.RateLimitError) return "busy";
  if (err instanceof Anthropic.BadRequestError) return "server_config";
  if (err instanceof Anthropic.NotFoundError) return "server_config";
  if (err instanceof Anthropic.APIConnectionError) return "network";
  if (err instanceof Anthropic.APIError) return "busy";
  return "unknown";
}
