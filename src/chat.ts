import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ask, embed } from "./lib/openai.js";
import { matchDocuments } from "./lib/supabase.js";

async function main() {
  const start = readline.createInterface({ input, output });
  console.log(`Rag chat - type exit to quit\n`);

  while (true) {
    const query = (await start.question("You: ")).trim();
    if (!query) continue;
    if (query.toLocaleLowerCase() === "exit") break;
    const [queryEmbedding] = await embed([query]);
    const matches = await matchDocuments(queryEmbedding, 3);
    console.log(`\nFound ${matches.length} matches for your query:\n`);
    const answer = await ask(
      query,
      matches.map((m: { content: string }) => m.content),
    );

    console.log(`\nAssistant:`, answer, "\n");
  }

  start.close();
}

main();
