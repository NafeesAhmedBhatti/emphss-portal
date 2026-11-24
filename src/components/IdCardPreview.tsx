"use client";

import { useMemo, useState } from "react";
import { generateQrSvgDataUrl } from "@/lib/qr-code";
import {
  Download,
  Printer,
  QrCode,
  RotateCw,
  ShieldCheck,
  User,
} from "lucide-react";

export interface IdCardData {
  type: "student" | "teacher";
  idNumber: string;
  name: string;
  photoData: string | null;
  primaryBadge: string;
  sessionOrRole: string;
  fields: { label: string; value: string }[];
}

function buildQrPayload(card: IdCardData): string {
  const lines = [
    "EMPHSS BAWLI - OFFICIAL ID CARD",
    `Type: ${card.type === "student" ? "Student" : "Faculty"}`,
    `ID: ${card.idNumber}`,
    `Name: ${card.name}`,
    `${card.primaryBadge} | ${card.sessionOrRole}`,
  ];
  for (const f of card.fields.slice(0, 4)) {
    lines.push(`${f.label}: ${f.value}`);
  }
  lines.push("Portal: https://emphss.vercel.app");
  return lines.join("\n");
}

function getBackRules(type: "student" | "teacher"): string[] {
  if (type === "teacher") {
    return [
      "Official Faculty Identity Card issued by EMPHSS Bawli Administration.",
      "This card is non-transferable and valid for authorized school faculty only.",
      "Loss of this card must be reported immediately to the School Office.",
      "If found, please return to EMPHSS Bawli (Thanamandi, Rajouri, J&K).",
    ];
  }
  return [
    "Students must carry this ID card daily in school and on school transport.",
    "This card is non-transferable and must be shown on demand by school staff.",
    "Report loss or damage immediately to your Class Form Teacher or Office.",
    "If found, please return to EMPHSS Bawli (Thanamandi, Rajouri, J&K).",
  ];
}

function drawFrontSide(
  ctx: CanvasRenderingContext2D,
  card: IdCardData,
  photoImg: HTMLImageElement | null,
  offsetY = 0
) {
  ctx.save();
  ctx.translate(0, offsetY);

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
    card.type === "student"
      ? `Student ID • ${card.sessionOrRole}`
      : `Faculty ID • ${card.sessionOrRole}`,
    36,
    112
  );

  // ID Number Pill on right
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(720, 32, 206, 64);
  ctx.fillStyle = "#FDE68A";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(
    card.type === "student" ? "STUDENT ID" : "TEACHER ID",
    740,
    56
  );
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(card.idNumber, 740, 84);

  // Photo box
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(36, 172, 210, 250);
  ctx.strokeStyle = "#0F2942";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 172, 210, 250);

  if (photoImg) {
    ctx.drawImage(photoImg, 38, 174, 206, 246);
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
  ctx.fillText("EMPHSS, Bawli • Front Side", 36, 555);
  ctx.fillStyle = "#0F2942";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("Authorized Digital Record", 730, 555);

  ctx.restore();
}

function drawBackSide(
  ctx: CanvasRenderingContext2D,
  card: IdCardData,
  qrImg: HTMLImageElement | null,
  offsetY = 0
) {
  ctx.save();
  ctx.translate(0, offsetY);

  // Card background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 960, 580);

  // Outer border
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 956, 576);

  // Header Navy Bar
  ctx.fillStyle = "#0F2942";
  ctx.fillRect(0, 0, 960, 108);

  // Gold accent strip
  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(0, 108, 960, 8);

  ctx.fillStyle = "#FBBF24";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("CARDHOLDER INSTRUCTIONS & QR VERIFICATION", 36, 42);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(
    "English Medium Public Higher Secondary School, Bawli",
    36,
    78
  );

  // Left QR Box
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(36, 152, 240, 290);
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 152, 240, 290);

  if (qrImg) {
    ctx.drawImage(qrImg, 56, 168, 200, 200);
  }
  ctx.fillStyle = "#0F2942";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("SCAN TO VERIFY ID", 84, 395);
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 14px monospace";
  ctx.fillText(card.idNumber, 105, 420);

  // Right Rules & Guidelines
  ctx.fillStyle = "#0F2942";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("RULES & REGULATIONS", 310, 180);

  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(310, 198);
  ctx.lineTo(920, 198);
  ctx.stroke();

  const rules = getBackRules(card.type);
  let ry = 240;
  rules.forEach((rule, idx) => {
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(`${idx + 1}.`, 310, ry);

    ctx.fillStyle = "#1E293B";
    ctx.font = "500 17px sans-serif";
    ctx.fillText(rule.slice(0, 68), 340, ry);
    ry += 44;
  });

  // Return Box
  ctx.fillStyle = "#FEF3C7";
  ctx.fillRect(310, 422, 610, 66);
  ctx.fillStyle = "#92400E";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("IF FOUND, PLEASE RETURN TO:", 328, 448);
  ctx.fillStyle = "#0F2942";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(
    "EMPHSS Office, Bawli (Thanamandi, Distt. Rajouri, J&K) • https://emphss.vercel.app",
    328,
    473
  );

  // Footer strip
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(2, 520, 956, 58);
  ctx.fillStyle = "#475569";
  ctx.font = "15px sans-serif";
  ctx.fillText(
    `EMPHSS, Bawli • Back Side (${card.sessionOrRole})`,
    36,
    555
  );
  ctx.fillStyle = "#0F2942";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("Issuing Authority: Principal, EMPHSS", 660, 555);

  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function downloadIdCardPng(card: IdCardData, qrDataUrl: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 1200; // Front (580) + gap (40) + Back (580)
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(0, 0, 960, 1200);

  const [photoImg, qrImg] = await Promise.all([
    card.photoData ? loadImage(card.photoData) : Promise.resolve(null),
    qrDataUrl ? loadImage(qrDataUrl) : Promise.resolve(null),
  ]);

  drawFrontSide(ctx, card, photoImg, 0);
  drawBackSide(ctx, card, qrImg, 620);

  const link = document.createElement("a");
  link.download = `${card.idNumber}-${card.name.replace(/\s+/g, "_")}-Front-Back.png`;
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
  const [side, setSide] = useState<"front" | "back">("front");

  const qrPayload = useMemo(() => buildQrPayload(card), [card]);
  const qrDataUrl = useMemo(() => generateQrSvgDataUrl(qrPayload), [qrPayload]);
  const rules = useMemo(() => getBackRules(card.type), [card.type]);

  return (
    <div className="space-y-4">
      {/* Front / Back Switcher Controls */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
        <div className="grid flex-1 grid-cols-2 gap-1.5 sm:flex sm:flex-initial">
          <button
            type="button"
            onClick={() => setSide("front")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              side === "front"
                ? "bg-[#0F2942] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Front Side
          </button>
          <button
            type="button"
            onClick={() => setSide("back")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              side === "back"
                ? "bg-[#0F2942] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-amber-500" />
            Back Side (QR &amp; Rules)
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSide((s) => (s === "front" ? "back" : "front"))}
          className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#0F2942] hover:bg-slate-100 sm:inline-flex"
        >
          <RotateCw className="h-3.5 w-3.5 text-amber-600" />
          Flip Card
        </button>
      </div>

      {/* FRONT SIDE */}
      {side === "front" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:rounded-3xl">
          {/* Header */}
          <div className="border-b-4 border-amber-500 bg-gradient-to-r from-[#0F2942] to-[#173E63] px-3.5 py-3 text-white sm:px-6 sm:py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="whitespace-nowrap text-[9.5px] font-bold tracking-normal text-amber-300 uppercase sm:text-[11px] sm:tracking-wider">
                  EMPHSS Bawli • {card.sessionOrRole}
                </p>
                <h3 className="font-heading mt-0.5 text-[11px] leading-snug font-bold text-white sm:text-base">
                  English Medium Public Higher Secondary School, Bawli
                </h3>
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
                  Official EMPHSS Identity Card • Front Side
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
      ) : (
        /* BACK SIDE (QR SCANNER & RULES) */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:rounded-3xl">
          {/* Header */}
          <div className="border-b-4 border-amber-500 bg-gradient-to-r from-[#0F2942] to-[#173E63] px-3.5 py-3 text-white sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-bold tracking-wider text-amber-300 uppercase sm:text-[11px]">
                  QR Verification &amp; Cardholder Rules
                </p>
                <h3 className="font-heading mt-0.5 truncate text-xs font-bold text-white sm:text-base">
                  English Medium Public Higher Secondary School, Bawli
                </h3>
              </div>
              <span className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-200 sm:text-xs">
                {card.idNumber}
              </span>
            </div>
          </div>

          {/* Back Body: QR Scanner + Rules */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              {/* Scannable QR Code Scanner Box */}
              <div className="flex shrink-0 flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center shadow-2xs">
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 sm:h-40 sm:w-40">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${card.idNumber}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <QrCode className="h-12 w-12 text-slate-300" />
                  )}
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-extrabold text-[#0F2942]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  SCAN TO VERIFY ID
                </p>
                <p className="font-mono text-[10px] font-semibold text-slate-500">
                  {card.idNumber}
                </p>
              </div>

              {/* Official School Rules & Return Address */}
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h4 className="font-heading text-xs font-extrabold tracking-wide text-[#0F2942] uppercase sm:text-sm">
                    Rules &amp; Regulations
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {rules.map((rule, idx) => (
                      <li
                        key={rule}
                        className="flex items-start gap-2 text-xs leading-relaxed text-slate-700"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900">
                          {idx + 1}
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
                  <p className="font-extrabold text-amber-900 uppercase">
                    If Found, Please Return To:
                  </p>
                  <p className="mt-0.5 font-semibold text-[#0F2942]">
                    English Medium Public Higher Secondary School, Bawli
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Tehsil Thanamandi, District Rajouri (J&amp;K) •
                    emphss.vercel.app
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Authority Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <span>Official EMPHSS Identity Card • Back Side</span>
              <span className="font-bold text-[#0F2942]">
                Issuing Authority: Principal, EMPHSS Bawli
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Download & Print Actions */}
      <div className="no-print flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => downloadIdCardPng(card, qrDataUrl)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-[#0F2942] shadow-md hover:bg-amber-400"
        >
          <Download className="h-4 w-4" />
          Download Front &amp; Back (PNG)
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
