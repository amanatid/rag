import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(texts: string[]): Promise<number[][]> {
  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return data.map((item) => item.embedding);
}

export async function ask(
  query: string,
  contextChunks: string[],
): Promise<string> {
  const context =
    contextChunks.length > 0
      ? contextChunks.join("\n\n")
      : "(No matching passages were found in the document.)";

  const { choices } = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          'You answer questions using only the context passages provided. If the context does not contain enough information, say: "I could not find that information in the supplied document context." Do not invent facts beyond the context.',
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${query}`,
      },
    ],
  });

  return choices[0]?.message?.content ?? "";
}
