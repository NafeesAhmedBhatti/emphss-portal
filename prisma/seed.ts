import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@EMPHSS2026", 10);
  const teacherAccessHash = await bcrypt.hash("Staff@EMPHSS2026", 10);

  await prisma.schoolSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      schoolName: "English Medium Public Higher Secondary School, Bawli",
      shortName: "EMPHSS",
      currentSession: "2026-27",
      adminEmail: "admin@emphss.edu.in",
      adminPasswordHash,
      teacherAccessHash,
      teacherPasscodeRaw: "[REDACTED]",
    },
  });

  await prisma.notice.deleteMany({});
  await prisma.notice.createMany({
    data: [
      {
        title: "Online Student Profile Registration Open (2026-27)",
        content:
          "All students from Nursery to Class 12th are requested to complete their digital student profile and save a screenshot of their Reference ID card.",
        category: "Admission",
        isPinned: true,
        isActive: true,
      },
      {
        title: "School Transport & Route Verification",
        content:
          "Students using school transport (van or bus) must enter their exact route and stop name in the registration form for accurate transport records.",
        category: "Transport",
        isPinned: false,
        isActive: true,
      },
    ],
  });

  console.log("EMPHSS database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
