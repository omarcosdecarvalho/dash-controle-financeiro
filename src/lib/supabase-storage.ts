import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.SUPABASE_URL!;
const supabaseKey     = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET          = "uploads";

function getClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar configurados.");
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Faz upload de um Buffer para o Supabase Storage e retorna a URL pública.
 */
export async function uploadArquivo(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const client = getClient();
  const path   = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;

  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Erro no upload: ${error.message}`);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
