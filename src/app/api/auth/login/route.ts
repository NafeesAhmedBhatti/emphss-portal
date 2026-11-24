import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { privateJson, verifySameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const mode = body.mode === "admin" ? "admin" : "teacher";
    const password = typeof body.password === "string" ? body.password : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!password) {
      return privateJson(
        { error: "Please enter your password." },
        { status: 400 }
      );
    }

    const ipKey = `login-ip:${ip}`;
    const modeKey = `login:${ip}:${mode}`;
    const [ipRl, modeRl] = await Promise.all([
      checkRateLimit(ipKey, 10, 15 * 60_000),
      checkRateLimit(modeKey, 6, 15 * 60_000),
    ]);

    if (!ipRl.allowed || !modeRl.allowed) {
      const retryAfterSec = Math.max(ipRl.retryAfterSec, modeRl.retryAfterSec);
      return privateJson(
        {
          error: `Too many login attempts. Please wait ${Math.ceil(
            retryAfterSec / 60
          )} minute(s) before trying again.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }

    const settings = await prisma.schoolSettings.findUnique({
      where: { id: "main" },
    });

    if (!settings) {
      return privateJson(
        { error: "School settings are not initialized." },
        { status: 500 }
      );
    }

    if (mode === "teacher") {
      const valid = await bcrypt.compare(password, settings.teacherAccessHash);
      if (!valid) {
        return privateJson(
          { error: "Invalid Teacher Access Password. Please check with the School Admin." },
          { status: 401 }
        );
      }

      await Promise.all([resetRateLimit(ipKey), resetRateLimit(modeKey)]);

      const token = await signSessionToken({
        role: "teacher",
        v: settings.sessionVersion,
      });
      const response = privateJson({
        success: true,
        role: "teacher",
        redirectTo: "/teacher/dashboard",
      });

      response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // Admin login
    if (!email || email !== settings.adminEmail.toLowerCase()) {
      return privateJson(
        { error: "Invalid admin email or password." },
        { status: 401 }
      );
    }

    const validAdmin = await bcrypt.compare(
      password,
      settings.adminPasswordHash
    );
    if (!validAdmin) {
      return privateJson(
        { error: "Invalid admin email or password." },
        { status: 401 }
      );
    }

    await Promise.all([resetRateLimit(ipKey), resetRateLimit(modeKey)]);

    const token = await signSessionToken({
      role: "admin",
      email: settings.adminEmail,
      v: settings.sessionVersion,
    });

    const response = privateJson({
      success: true,
      role: "admin",
      redirectTo: "/admin",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return privateJson(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
