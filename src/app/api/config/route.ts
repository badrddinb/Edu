export const dynamic = "force-dynamic";

/** Tells the page whether generation is available and whether it is protected by a code. */
export async function GET() {
  return Response.json({
    ready: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    needsCode: Boolean(process.env.ACCESS_CODE),
  });
}
