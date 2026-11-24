"use client";

import { Download, Printer, User } from "lucide-react";

export interface IdCardData {
  type: "student" | "teacher";
  idNumber: string;
  name: string;
  photoData: string | null;
  primaryBadge: string; // e.g., "Class 8th" or "M.Sc., B.Ed."
  sessionOrRole: string; // e.g., "Session 2026-27" or "Mathematics, Physics"
  fields: { label: string; value: string }[];
}

async function downloadIdCardPng(card: IdCardData) {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 580;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Card background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 960, 580);

  // Outer border
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 956, 576);

  // Header Navy Bar
  ctx.fillStyle = "#0F2942";
  ctx.fillRect(0, 0, 960, 128);

  // Gold accent strip
  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(0, 128, 960, 8);

  // School Name
  ctx.fillStyle = "#FBBF24";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("EMPHSS BAWLI • OFFICIAL IDENTITY CARD", 36, 46);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("English Medium Public Higher Secondary School", 36, 86);

  ctx.fillStyle = "#CBD5E1";
  ctx.font = "16px sans-serif";
  ctx.fillText(
    card.type === "student" ? `Student ID • ${card.sessionOrRole}` : `Faculty ID • ${card.sessionOrRole}`,
    36,
    112
  );

  // ID Number Pill on right
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(720, 32, 206, 64);
  ctx.fillStyle = "#FDE68A";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(card.type === "student" ? "STUDENT ID" : "TEACHER ID", 740, 56);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(card.idNumber, 740, 84);

  // Photo box
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(36, 172, 210, 250);
  ctx.strokeStyle = "#0F2942";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 172, 210, 250);

  if (card.photoData) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 38, 174, 206, 246);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = card.photoData!;
    });
  } else {
    ctx.fillStyle = "#94A3B8";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("NO PHOTO", 88, 305);
  }

  // Primary Badge under photo
  ctx.fillStyle = "#0F2942";
  ctx.fillRect(36, 438, 210, 44);
  ctx.fillStyle = "#FBBF24";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(card.primaryBadge.slice(0, 20), 52, 466);

  // Name
  ctx.fillStyle = "#0F2942";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(card.name.slice(0, 34), 280, 208);

  // Divider line
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(280, 228);
  ctx.lineTo(920, 228);
  ctx.stroke();

  // Details grid
  let y = 270;
  for (const field of card.fields.slice(0, 6)) {
    ctx.fillStyle = "#64748B";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(field.label.toUpperCase(), 280, y);

    ctx.fillStyle = "#0F172A";
    ctx.font = "600 20px sans-serif";
    ctx.fillText(field.value.slice(0, 42), 470, y);

    y += 44;
  }

  // Footer strip
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(2, 520, 956, 58);
  ctx.fillStyle = "#475569";
  ctx.font = "15px sans-serif";
  ctx.fillText("EMPHSS, Bawli • Official Digital Identity Card", 36, 555);
  ctx.fillStyle = "#0F2942";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("Authorized Digital Record", 730, 555);

  const link = document.createElement("a");
  link.download = `${card.idNumber}-${card.name.replace(/\s+/g, "_")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function IdCardPreview({
  card,
  showPrintButton = true,
}: {
  card: IdCardData;
  showPrintButton?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Visual ID Card — Compact on Mobile & Desktop */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:rounded-3xl">
        {/* Header */}
        <div className="border-b-4 border-amber-500 bg-gradient-to-r from-[#0F2942] to-[#173E63] px-3.5 py-3 text-white sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="whitespace-nowrap text-[9.5px] font-bold tracking-normal text-amber-300 uppercase sm:text-[11px] sm:tracking-wider">
                EMPHSS Bawli • {card.sessionOrRole}
              </p>
              {card.type === "student" && (
                <h3 className="font-heading mt-0.5 text-[11px] leading-snug font-bold text-white sm:text-base">
                  English Medium Public Higher Secondary School, Bawli
                </h3>
              )}
            </div>
            <div className="shrink-0 rounded-lg border border-amber-400/40 bg-white/10 px-2 py-1 text-right sm:rounded-xl sm:px-3.5 sm:py-1.5">
              <p className="text-[8px] font-semibold tracking-wider text-amber-200 uppercase sm:text-[10px]">
                {card.type === "student" ? "Student ID" : "Teacher ID"}
              </p>
              <p className="font-heading text-[11px] font-bold text-white sm:text-sm">
                {card.idNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3.5 sm:gap-5">
            <div className="flex shrink-0 flex-col items-center">
              <div className="h-24 w-20 overflow-hidden rounded-xl border-2 border-[#0F2942] bg-slate-100 shadow-xs sm:h-28 sm:w-24 sm:rounded-2xl">
                {card.photoData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.photoData}
                    alt={card.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-md bg-[#0F2942] px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                {card.primaryBadge}
              </span>
              <h4 className="font-heading mt-1.5 truncate text-lg font-bold text-[#0F2942] sm:text-xl">
                {card.name}
              </h4>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                Official EMPHSS Identity Card
              </p>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:gap-2.5">
            {card.fields.map((f) => (
              <div
                key={f.label}
                className="rounded-lg bg-slate-50 px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2"
              >
                <dt className="truncate text-[10px] font-semibold text-slate-500 uppercase">
                  {f.label}
                </dt>
                <dd className="mt-0.5 truncate font-semibold text-slate-900">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Download & Print Actions */}
      <div className="no-print flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => downloadIdCardPng(card)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-[#0F2942] shadow-md hover:bg-amber-400"
        >
          <Download className="h-4 w-4" />
          Download ID Card (PNG)
        </button>
        {showPrintButton && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#163B5E]"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            Print / Save PDF
          </button>
        )}
      </div>
    </div>
  );
}
