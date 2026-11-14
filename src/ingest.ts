import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";
import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { embed } from "./lib/openai.js";
import { deleteBySource, insertDocuments } from "./lib/supabase.js";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.post("/ingest", upload.single("file"), async (req, res) => {
  console.log
  try {
    if (!req.file) {
      res.status(500).json({ error: "Upload a pdf file first" });
      return;
    }
  console.log(`Ingesting file: ${req.file.originalname}`);
    const parser = new PDFParse({
      data: new Uint8Array(req.file.buffer),
    });

    const parsed = await parser.getText();
    const text = parsed.text;

    if (!text.trim()) {
      res.status(400).json({ error: "No text found in pdf" });
      return;
    }
   console.log(`Splitting text into chunks of size ${CHUNK_SIZE} with overlap ${CHUNK_OVERLAP}`);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    console.log(`Splitting  phase  two`);
    const chunks = await splitter.splitText(text);
    const embeddings = await await embed(chunks);

    console.log(`Generated embeddings for ${chunks.length} chunks`);
    const source = req.file.originalname;
    console.log(`Deleting existing documents from Supabase for source: ${source}`);
    await deleteBySource(source);
    console.log(`deleted `);
    
    console.log(`Deleted existing documents for source: ${source}`);
    const rows = chunks.map((content, index) => ({
      content,
      metadata: { source, chunk_index: index },
      embedding: embeddings[index],
    }));

    console.log(`Prepared ${rows.length} rows for insertion into Supabase`);
    await insertDocuments(rows);

    res.json({ ok: true, source, chunks: rows.length });
  } catch (error) {
    res.status(500).json({ error: "Error occured in ingestion",
          });
  }
});

app.listen(3000, "127.0.0.1", () => {
  console.log(`Post to localhost 3000 ingest endpoint`);
});
