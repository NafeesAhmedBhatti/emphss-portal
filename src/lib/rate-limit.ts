import { prisma } from "@/lib/prisma";

interface AttemptEntry {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, AttemptEntry>();

export function getClientIp(request: Request): string {
  // Prefer Vercel's trusted edge header when deployed on Vercel
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const ip = parts[parts.length - 1];
    if (ip) return ip.slice(0, 64);
  }

  return "local";
}

export function checkMemoryRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = memoryBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);

  try {
    // Opportunistically clean up expired rate-limit entries (~5% of requests)
    if (Math.random() < 0.05) {
      await prisma.rateLimit.deleteMany({
        where: { resetAt: { lt: now } },
      });
    }

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimit.findUnique({ where: { key } });

      if (!existing || existing.resetAt <= now) {
        await tx.rateLimit.upsert({
          where: { key },
          update: { count: 1, resetAt: nextReset },
          create: { key, count: 1, resetAt: nextReset },
        });
        return { allowed: true, retryAfterSec: 0 };
      }

      if (existing.count >= maxAttempts) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)
        );
        return { allowed: false, retryAfterSec };
      }

      await tx.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
      return { allowed: true, retryAfterSec: 0 };
    });
  } catch {
    return checkMemoryRateLimit(key, maxAttempts, windowMs);
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  memoryBuckets.delete(key);
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch {
    // Ignore DB cleanup errors
  }
}
