import { timingSafeEqual } from "node:crypto";

/** True when no access code is configured, or when the request carries the right one. */
export function accessAllowed(request: Request): boolean {
  const expected = process.env.ACCESS_CODE;
  if (!expected) return true;
  const given = request.headers.get("x-access-code") ?? "";
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
