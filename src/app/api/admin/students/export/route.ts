import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function csvCell(val: string | null | undefined): string {
  let str = String(val ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classFilter = searchParams.get("class") || "";
  const transportFilter = searchParams.get("transport") || "";

  const where: Record<string, string> = {};
  if (classFilter && classFilter !== "All") {
    where.currentClass = classFilter;
  }
  if (transportFilter && transportFilter !== "All") {
    where.transportMode = transportFilter;
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: [{ currentClass: "asc" }, { studentName: "asc" }],
  });

  const headers = [
    "Reference ID",
    "Student Name",
    "Class",
    "Gender",
    "Date of Birth",
    "Father Name",
    "Mother Name",
    "Mobile Number",
    "Address",
    "Transport Mode",
    "Vehicle / Route",
    "Academic Year",
    "Status",
    "Submitted At",
  ];

  const rows = students.map((s) =>
    [
      csvCell(s.referenceId),
      csvCell(s.studentName),
      csvCell(s.currentClass),
      csvCell(s.gender),
      csvCell(s.dateOfBirth),
      csvCell(s.fatherName),
      csvCell(s.motherName),
      csvCell(s.mobileNumber),
      csvCell(s.address),
      csvCell(s.transportMode),
      csvCell(s.vehicleRoute || "-"),
      csvCell(s.academicYear),
      csvCell(s.status),
      csvCell(s.createdAt.toISOString().split("T")[0]),
    ].join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="EMPHSS-Students-Export.csv"`,
    },
  });
}
