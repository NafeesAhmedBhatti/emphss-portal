import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CLASS_ORDER, getSubjectsForClass } from "@/lib/constants";
import { privateJson, verifySameOrigin } from "@/lib/http";
import {
  canAccessClass,
  canEditSubject,
  getAuthorizedTeacher,
} from "@/lib/teacher-authz";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return privateJson({ error: "Unauthorized." }, { status: 401 });
  }

  const authz = await getAuthorizedTeacher(session);
  if (!authz) {
    return privateJson(
      { error: "Please verify your Teacher Profile PIN first." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const className = (searchParams.get("className") || "").trim();
  const examName = (searchParams.get("examName") || "T1").trim().slice(0, 30);

  if (!CLASS_ORDER.includes(className as (typeof CLASS_ORDER)[number])) {
    return privateJson(
      { error: "Valid class name is required." },
      { status: 400 }
    );
  }

  if (!canAccessClass(authz, className)) {
    return privateJson(
      { error: "You are not assigned to this class Award Roll." },
      { status: 403 }
    );
  }

  const settings = await prisma.schoolSettings.findUnique({
    where: { id: "main" },
  });
  const currentSession = settings?.currentSession ?? "2026-27";

  const [students, existingRoll] = await Promise.all([
    prisma.student.findMany({
      where: { status: "Active", currentClass: className },
      orderBy: { studentName: "asc" },
      select: {
        id: true,
        referenceId: true,
        studentName: true,
        fatherName: true,
        subjects: true,
      },
    }),
    prisma.awardRoll.findUnique({
      where: {
        className_examName_session: {
          className,
          examName,
          session: currentSession,
        },
      },
    }),
  ]);

  const defaultSubjects = getSubjectsForClass(className);
  let subjects = defaultSubjects;
  let marks: Record<string, Record<string, string>> = {};
  let section = "A";
  let maxMarksPerSubject = 50;

  if (existingRoll) {
    try {
      const parsedSubjects = JSON.parse(existingRoll.subjectsJson);
      if (Array.isArray(parsedSubjects) && parsedSubjects.length > 0) {
        subjects = parsedSubjects;
      }
      marks = JSON.parse(existingRoll.marksJson) || {};
      section = existingRoll.section;
      maxMarksPerSubject = existingRoll.maxMarksPerSubject;
    } catch {
      // fallback to defaults
    }
  }

  return privateJson({
    session: currentSession,
    className,
    examName,
    section,
    maxMarksPerSubject,
    subjects,
    students,
    marks,
  });
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return privateJson({ error: "Unauthorized." }, { status: 401 });
  }

  const authz = await getAuthorizedTeacher(session);
  if (!authz) {
    return privateJson(
      { error: "Please verify your Teacher Profile PIN first." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const className =
      typeof body.className === "string" ? body.className.trim() : "";
    const examName =
      typeof body.examName === "string" && body.examName.trim()
        ? body.examName.trim().slice(0, 30)
        : "T1";
    const section =
      typeof body.section === "string" && body.section.trim()
        ? body.section.trim().slice(0, 10)
        : "A";
    const maxMarksPerSubject = Math.max(
      1,
      Math.min(1000, Number(body.maxMarksPerSubject) || 50)
    );

    if (!CLASS_ORDER.includes(className as (typeof CLASS_ORDER)[number])) {
      return privateJson(
        { error: "Valid class name is required." },
        { status: 400 }
      );
    }

    if (!canAccessClass(authz, className)) {
      return privateJson(
        { error: "You are not assigned to edit this class Award Roll." },
        { status: 403 }
      );
    }

    const rawSubjects: unknown[] = Array.isArray(body.subjects)
      ? body.subjects
      : getSubjectsForClass(className);
    const subjects = rawSubjects
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 60)
      .slice(0, 25);

    if (subjects.length === 0) {
      return privateJson(
        { error: "At least one valid subject is required." },
        { status: 400 }
      );
    }

    const settings = await prisma.schoolSettings.findUnique({
      where: { id: "main" },
    });
    const currentSession = settings?.currentSession ?? "2026-27";

    const [activeClassStudents, existingRoll] = await Promise.all([
      prisma.student.findMany({
        where: { status: "Active", currentClass: className },
        select: { id: true },
      }),
      prisma.awardRoll.findUnique({
        where: {
          className_examName_session: {
            className,
            examName,
            session: currentSession,
          },
        },
      }),
    ]);

    const validStudentIds = new Set(activeClassStudents.map((s) => s.id));

    let existingMarks: Record<string, Record<string, string>> = {};
    if (existingRoll) {
      try {
        existingMarks = JSON.parse(existingRoll.marksJson) || {};
      } catch {
        existingMarks = {};
      }
    }

    const isFormTeacherOrAdmin =
      authz.isAdmin || authz.teacher?.formTeacherClass === className;

    const sanitizedMarks: Record<string, Record<string, string>> = {};
    if (body.marks && typeof body.marks === "object" && !Array.isArray(body.marks)) {
      for (const [stuId, subjObj] of Object.entries(
        body.marks as Record<string, unknown>
      )) {
        if (!validStudentIds.has(stuId)) continue;
        if (!subjObj || typeof subjObj !== "object" || Array.isArray(subjObj)) {
          continue;
        }
        const stuMarks: Record<string, string> = isFormTeacherOrAdmin
          ? {}
          : { ...(existingMarks[stuId] || {}) };

        for (const [subj, val] of Object.entries(
          subjObj as Record<string, unknown>
        )) {
          const cleanSubj = subj.slice(0, 60);
          if (typeof val !== "string" || val.length > 20) continue;

          if (!isFormTeacherOrAdmin && !canEditSubject(authz, className, cleanSubj)) {
            // Preserve existing mark if unchanged; reject if subject teacher tried to alter another subject
            const prevVal = existingMarks[stuId]?.[cleanSubj] ?? "";
            if (val.trim() !== prevVal) {
              return privateJson(
                {
                  error: `You are not assigned to edit marks for subject "${cleanSubj}".`,
                },
                { status: 403 }
              );
            }
            continue;
          }

          stuMarks[cleanSubj] = val.trim();
        }
        sanitizedMarks[stuId] = stuMarks;
      }
    }

    const saved = await prisma.awardRoll.upsert({
      where: {
        className_examName_session: {
          className,
          examName,
          session: currentSession,
        },
      },
      update: {
        section,
        maxMarksPerSubject,
        subjectsJson: JSON.stringify(subjects),
        marksJson: JSON.stringify(sanitizedMarks),
      },
      create: {
        className,
        examName,
        session: currentSession,
        section,
        maxMarksPerSubject,
        subjectsJson: JSON.stringify(subjects),
        marksJson: JSON.stringify(sanitizedMarks),
      },
    });

    return privateJson({ success: true, awardRoll: saved });
  } catch (error) {
    console.error("Save award roll error:", error);
    return privateJson(
      { error: "Unable to save Award Roll draft." },
      { status: 500 }
    );
  }
}
