import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export async function deleteBySource(source: string): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .delete()
    .contains("metadata", { source });

  if (error) {
    console.error("Supabase deleteBySource failed:", {
      source,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message);
  }
}

export async function insertDocuments(
  rows: { content: string; metadata: object; embedding: number[] }[],
): Promise<void> {
  const { error } = await supabase.from("documents").insert(rows);
  if (error) throw new Error(error.message);
}

export async function matchDocuments(queryEmbedding: number[], matchCount = 3) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding, // 1536 float array from OpenAI
    match_count: matchCount,
  });
  console.log("Supabase matchDocuments result:", { data, error });
  if (error) throw new Error(error.message);
  return data ?? [];
}
