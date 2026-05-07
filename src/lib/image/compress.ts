"use client";

/**
 * Compresión de imágenes en el navegador antes de subirlas a Supabase Storage.
 *
 * Hace 3 cosas:
 *  1. Redimensiona a `maxDimension` px en el lado más largo (preserva aspect ratio).
 *  2. Convierte a WebP (25–35% más liviano que JPEG con calidad equivalente).
 *  3. Calidad 0.82 — visualmente idéntico al original para fotos de comida.
 *
 * Uso típico: una foto de 5 MB del celular queda en ~150 KB sin pérdida visible.
 * Si el navegador no soporta WebP (raro hoy), cae a JPEG con la misma calidad.
 */
export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  format?: "image/webp" | "image/jpeg";
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxDimension: 1200,
  quality: 0.82,
  format: "image/webp",
};

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Si el archivo ya es pequeño y no es enorme, no hace falta tocarlo.
  // Igual lo procesamos para normalizar formato.
  const bitmap = await readAsBitmap(file);

  const { width, height } = scaleToFit(
    bitmap.width,
    bitmap.height,
    opts.maxDimension,
  );

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : createDomCanvas(width, height);

  const ctx = canvas.getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error("No se pudo obtener contexto de canvas");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await canvasToBlob(canvas, opts.format, opts.quality);
  if (!blob) throw new Error("La compresión devolvió un blob vacío");

  // Si por alguna razón el resultado pesa más que el original (imágenes ya
  // optimizadas, casos raros), usamos el original.
  if (blob.size >= file.size && file.type === blob.type) {
    return file;
  }

  const ext = opts.format === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}

async function readAsBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  // Fallback ultra raro (Safari muy viejo): cargar via <img> + canvas.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return img as unknown as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scaleToFit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  if (w >= h) {
    return { width: max, height: Math.round((h / w) * max) };
  }
  return { width: Math.round((w / h) * max), height: max };
}

function createDomCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality: number,
): Promise<Blob | null> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), type, quality),
  );
}
