export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  format?: "jpeg" | "png" | "webp";
  width?: number;
  height?: number;
  byteLength?: number;
}

const MAX_BASE64_LENGTH = 700_000;
const MAX_DECODED_BYTES = 525_000;
const MIN_DECODED_BYTES = 64;
const MAX_DIMENSION = 2048;

function readPngDimensions(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  // IHDR chunk starts at byte 12 ("IHDR")
  if (buf[12] !== 0x49 || buf[13] !== 0x48 || buf[14] !== 0x44 || buf[15] !== 0x52) {
    return null;
  }
  const width = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
  const height = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
  return { width: width >>> 0, height: height >>> 0 };
}

function readJpegDimensions(buf: Uint8Array): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 4 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // Standalone markers (SOI, EOI, RST0-7, TEM)
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    if (offset + 4 > buf.length) break;
    const segLen = (buf[offset + 2] << 8) | buf[offset + 3];
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof && offset + 9 <= buf.length) {
      const height = (buf[offset + 5] << 8) | buf[offset + 6];
      const width = (buf[offset + 7] << 8) | buf[offset + 8];
      return { width, height };
    }
    if (segLen < 2) break;
    offset += 2 + segLen;
  }
  return null;
}

function readWebpDimensions(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  const chunk = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (chunk === "VP8 " && buf.length >= 30) {
    const width = (buf[26] | (buf[27] << 8)) & 0x3fff;
    const height = (buf[28] | (buf[29] << 8)) & 0x3fff;
    return { width, height };
  }
  if (chunk === "VP8L" && buf.length >= 25) {
    const b0 = buf[21];
    const b1 = buf[22];
    const b2 = buf[23];
    const b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  if (chunk === "VP8X" && buf.length >= 30) {
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }
  return null;
}

export function validateStudentPhotoDataUrl(photoData: string): ImageValidationResult {
  if (!photoData || typeof photoData !== "string") {
    return { valid: false, error: "Please upload a student photograph." };
  }
  if (photoData.length > MAX_BASE64_LENGTH) {
    return {
      valid: false,
      error: "Photo file is too large. Please choose a smaller image.",
    };
  }

  const match = photoData.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return {
      valid: false,
      error: "Please upload a valid JPG, PNG, or WebP image.",
    };
  }

  const declaredFormat = match[1] as "jpeg" | "png" | "webp";
  const b64 = match[2];

  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return { valid: false, error: "Corrupted image encoding." };
  }

  if (buf.length < MIN_DECODED_BYTES || buf.length > MAX_DECODED_BYTES) {
    return {
      valid: false,
      error: "Photo size is invalid or exceeds 500 KB.",
    };
  }

  // Verify binary magic signatures
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;
  const isWebp =
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50;

  if (
    (declaredFormat === "jpeg" && !isJpeg) ||
    (declaredFormat === "png" && !isPng) ||
    (declaredFormat === "webp" && !isWebp)
  ) {
    return {
      valid: false,
      error: "Uploaded file content does not match a valid JPG, PNG, or WebP image.",
    };
  }

  const dims =
    declaredFormat === "png"
      ? readPngDimensions(buf)
      : declaredFormat === "jpeg"
      ? readJpegDimensions(buf)
      : readWebpDimensions(buf);

  if (
    !dims ||
    dims.width < 1 ||
    dims.height < 1 ||
    dims.width > MAX_DIMENSION ||
    dims.height > MAX_DIMENSION
  ) {
    return {
      valid: false,
      error: "Image dimensions are invalid or exceed 2048x2048 pixels.",
    };
  }

  return {
    valid: true,
    format: declaredFormat,
    width: dims.width,
    height: dims.height,
    byteLength: buf.length,
  };
}
