import { NextResponse } from "next/server";

export const PRIVATE_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Vary: "Cookie",
} as const;

export function privateJson(
  data: unknown,
  init?: { status?: number; headers?: Record<string, string> }
) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: {
      ...PRIVATE_CACHE_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

export function verifySameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Non-browser clients or same-origin requests without Origin header
    return true;
  }

  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;

  try {
    const parsed = new URL(origin);
    return parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
