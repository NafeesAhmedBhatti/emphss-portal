import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "emphss_session";
export const STUDENT_COOKIE_NAME = "emphss_student";

export type UserRole = "admin" | "teacher";

export interface SessionPayload {
  role: UserRole;
  email?: string;
  v?: number;
  teacherId?: string;
  tv?: number;
}

export interface StudentSessionPayload {
  studentId: string;
  referenceId: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable must be set in production.");
  }
  return new TextEncoder().encode(
    secret || "emphss-bawli-local-dev-secret-key-2026"
  );
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const expiration = payload.role === "admin" ? "7d" : "30d";
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role === "admin" || payload.role === "teacher") {
      return {
        role: payload.role,
        email: typeof payload.email === "string" ? payload.email : undefined,
        v: typeof payload.v === "number" ? payload.v : undefined,
        teacherId:
          typeof payload.teacherId === "string" ? payload.teacherId : undefined,
        tv: typeof payload.tv === "number" ? payload.tv : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const settings = await prisma.schoolSettings.findUnique({
    where: { id: "main" },
    select: { sessionVersion: true },
  });
  if (settings && session.v !== settings.sessionVersion) {
    return null;
  }

  return session;
}

export async function signStudentToken(
  payload: StudentSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload, kind: "student" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifyStudentToken(
  token: string
): Promise<StudentSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.kind === "student" &&
      typeof payload.studentId === "string" &&
      typeof payload.referenceId === "string"
    ) {
      return {
        studentId: payload.studentId,
        referenceId: payload.referenceId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getStudentSession(): Promise<StudentSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStudentToken(token);
}
