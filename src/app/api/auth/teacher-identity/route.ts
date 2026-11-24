import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const teacherId =
      typeof body.teacherId === "string" ? body.teacherId.trim() : "";

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, isActive: true },
      select: { id: true, teacherCode: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Active teacher profile not found." },
        { status: 404 }
      );
    }

    const token = await signSessionToken({
      role: session.role,
      email: session.email,
      v: session.v,
      teacherId: teacher.id,
    });

    const response = NextResponse.json({
      success: true,
      teacherId: teacher.id,
      teacherCode: teacher.teacherCode,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: session.role === "admin" ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Teacher identity bind error:", error);
    return NextResponse.json(
      { error: "Unable to bind teacher profile." },
      { status: 500 }
    );
  }
}
