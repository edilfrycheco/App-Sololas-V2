"use server";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "referencias";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Sube una imagen de referencia al bucket `referencias` (se debe crear como
 * público en Supabase Storage). El cliente comprime la imagen antes
 * (lib/image/compress.ts), por lo que aquí solo validamos tipo y tamaño.
 */
export async function uploadReferenceImage(
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Archivo no válido" };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Imagen excede 8 MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Solo se permiten imágenes" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "webp";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      return {
        ok: false,
        error:
          "Falta crear el bucket 'referencias' en Supabase Storage (público).",
      };
    }
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { ok: true, url: data.publicUrl };
}
