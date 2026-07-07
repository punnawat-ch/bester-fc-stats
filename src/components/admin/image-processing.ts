/**
 * Client-side image processing for admin uploads (browser only).
 *
 * - `processImage` resizes to a max dimension and re-encodes as PNG (PNG keeps
 *   the alpha channel that manual cut-out PNGs rely on).
 */

const MAX_DIMENSION = 1600;
/** Stride for alpha sampling — every Nth pixel is enough to detect a cut-out. */
const ALPHA_SAMPLE_STRIDE = 16;

export type ProcessedImage = Readonly<{
  blob: Blob;
  /** True when the result contains any meaningfully transparent pixel. */
  hasAlpha: boolean;
}>;

function scaleFor(width: number, height: number, maxDimension: number): number {
  const largestSide = Math.max(width, height);
  if (largestSide <= maxDimension) {
    return 1;
  }
  return maxDimension / largestSide;
}

function detectAlpha(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 4 * ALPHA_SAMPLE_STRIDE) {
    if (data[i] < 250) {
      return true;
    }
  }
  return false;
}

async function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (blob == null) {
    throw new Error("Image encoding failed");
  }
  return blob;
}

/** Resize (keeping aspect ratio) and re-encode `source` as a PNG. */
export async function processImage(
  source: Blob,
  maxDimension = MAX_DIMENSION,
): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(source);
  const scale = scaleFor(bitmap.width, bitmap.height, maxDimension);
  const targetW = Math.max(1, Math.round(bitmap.width * scale));
  const targetH = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    bitmap.close();
    throw new Error("Canvas 2D context is unavailable");
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const hasAlpha = detectAlpha(ctx, targetW, targetH);
  const blob = await encodePng(canvas);
  return { blob, hasAlpha };
}
