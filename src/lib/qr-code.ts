/**
 * Zero-dependency ISO/IEC 18004 QR Code SVG Data-URL Generator (Byte Mode, ECC Level L).
 * Supports Versions 1–10 (up to 271 bytes) and produces standard scannable QR codes.
 */

// Version capacities for Byte Mode at ECC Level L:
// [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsGroup1, numBlocksGroup2, dataCodewordsGroup2]
const VERSION_TABLE: [number, number, number, number, number, number][] = [
  [0, 0, 0, 0, 0, 0], // placeholder for 1-based indexing
  [26, 7, 1, 19, 0, 0], // V1 (21x21): 17 bytes
  [44, 10, 1, 34, 0, 0], // V2 (25x25): 32 bytes
  [70, 15, 1, 55, 0, 0], // V3 (29x29): 53 bytes
  [100, 20, 1, 80, 0, 0], // V4 (33x33): 78 bytes
  [134, 26, 1, 108, 0, 0], // V5 (37x37): 106 bytes
  [172, 18, 2, 68, 0, 0], // V6 (41x41): 134 bytes
  [196, 20, 2, 78, 0, 0], // V7 (45x45): 154 bytes
  [242, 24, 2, 97, 0, 0], // V8 (49x49): 192 bytes
  [292, 30, 2, 116, 0, 0], // V9 (53x53): 230 bytes
  [346, 18, 2, 68, 2, 69], // V10 (57x57): 271 bytes
];

const ALIGNMENT_POSITIONS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

// GF(256) tables with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const rem = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecLen - 1] = 0;
    for (let j = 0; j < ecLen; j++) {
      rem[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return rem;
}

function pickVersion(byteLen: number): number {
  for (let v = 1; v <= 10; v++) {
    const [, , b1, d1, b2, d2] = VERSION_TABLE[v];
    const totalDataCap = b1 * d1 + b2 * d2;
    const headerBytes = v <= 9 ? 2 : 3;
    if (byteLen + headerBytes <= totalDataCap) return v;
  }
  return 10;
}

export function generateQrSvgDataUrl(text: string): string {
  const rawBytes = new TextEncoder().encode(text.slice(0, 265));
  const version = pickVersion(rawBytes.length);
  const [, ecLen, b1, d1, b2, d2] = VERSION_TABLE[version];
  const totalDataBytes = b1 * d1 + b2 * d2;

  // Build bit stream: Mode 0100 (Byte), char count (8 bits for V1-9, 16 bits for V10)
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(rawBytes.length, version <= 9 ? 8 : 16);
  for (const b of rawBytes) pushBits(b, 8);

  const maxBits = totalDataBytes * 8;
  const terminator = Math.min(4, maxBits - bits.length);
  pushBits(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = new Uint8Array(totalDataBytes);
  let byteIdx = 0;
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | bits[i + j];
    dataBytes[byteIdx++] = val;
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (byteIdx < totalDataBytes) {
    dataBytes[byteIdx++] = padBytes[padIdx % 2];
    padIdx++;
  }

  // Split into blocks & compute RS error correction
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let i = 0; i < b1; i++) {
    const blk = dataBytes.slice(offset, offset + d1);
    offset += d1;
    dataBlocks.push(blk);
    ecBlocks.push(rsEncode(blk, ecLen));
  }
  for (let i = 0; i < b2; i++) {
    const blk = dataBytes.slice(offset, offset + d2);
    offset += d2;
    dataBlocks.push(blk);
    ecBlocks.push(rsEncode(blk, ecLen));
  }

  // Interleave data and EC codewords
  const finalCodewords: number[] = [];
  const maxDataLen = Math.max(d1, d2);
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of dataBlocks) {
      if (i < blk.length) finalCodewords.push(blk[i]);
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (const blk of ecBlocks) {
      finalCodewords.push(blk[i]);
    }
  }

  // Matrix setup
  const size = 17 + version * 4;
  const modules: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const setFunc = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(top + dr, left + dc, inOuter && (onBorder || inInner));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const align = ALIGNMENT_POSITIONS[version];
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === align.length - 1) ||
        (i === align.length - 1 && j === 0)
      ) {
        continue;
      }
      const cr = align[i];
      const cc = align[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark =
            Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setFunc(cr + dr, cc + dc, dark);
        }
      }
    }
  }

  // Reserve format info & dark module
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setFunc(8, i, false);
      setFunc(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunc(8, size - 1 - i, false);
    setFunc(size - 1 - i, 8, false);
  }
  setFunc(size - 8, 8, true);

  // Place data bits in upward/downward 2-column zig-zag
  const allBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) allBits.push((cw >> b) & 1);
  }

  let bitPtr = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          const bit = bitPtr < allBits.length ? allBits[bitPtr++] === 1 : false;
          // Apply Mask 0: (r + c) % 2 === 0
          modules[r][c] = (r + c) % 2 === 0 ? !bit : bit;
        }
      }
    }
    upward = !upward;
  }

  // Format information for ECC Level L (01) + Mask 0 (000) -> precomputed BCH = 0x77c4
  const FORMAT_BITS = 0x77c4;
  for (let i = 0; i <= 5; i++) setFunc(8, i, ((FORMAT_BITS >> i) & 1) === 1);
  setFunc(8, 7, ((FORMAT_BITS >> 6) & 1) === 1);
  setFunc(8, 8, ((FORMAT_BITS >> 7) & 1) === 1);
  setFunc(7, 8, ((FORMAT_BITS >> 8) & 1) === 1);
  for (let i = 9; i < 15; i++) {
    setFunc(14 - i, 8, ((FORMAT_BITS >> i) & 1) === 1);
  }
  for (let i = 0; i < 8; i++) {
    setFunc(8, size - 1 - i, ((FORMAT_BITS >> i) & 1) === 1);
  }
  for (let i = 8; i < 15; i++) {
    setFunc(size - 15 + i, 8, ((FORMAT_BITS >> i) & 1) === 1);
  }

  // Render crisp SVG
  const margin = 2;
  const viewSize = size + margin * 2;
  let path = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        path += `M${c + margin},${r + margin}h1v1h-1z`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges"><rect width="${viewSize}" height="${viewSize}" fill="#FFFFFF"/><path d="${path}" fill="#0F2942"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
