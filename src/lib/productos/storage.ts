"use server";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "productos";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Sube una imagen al bucket `productos` de Supabase Storage y devuelve la URL
 * pública. El bucket debe existir y ser público (lo crea Raizel desde Supabase
 * Storage UI; ver docs/AUDITORIA-APP-ACTUAL.md sección "Imagenes").
 */
export async function uploadProductoImage(
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Archivo no válido" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Imagen excede 5 MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Solo se permiten imágenes" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
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
          "Falta crear el bucket 'productos' en Supabase Storage (público).",
      };
    }
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { ok: true, url: data.publicUrl };
}
