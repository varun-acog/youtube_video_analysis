import fs from "fs";
import path from "path";
import "dotenv/config";

import { searchDiseaseVideos } from "../lib/youtube.js"; // Assume this fetches video transcripts

async function fetchAndSaveTranscripts(query: string) {
  console.log(`Fetching transcripts for: ${query}`);

  const transcriptsDir = path.join(
    process.cwd(),
    "transcripts",
    query.replace(/\s+/g, "_")
  );
  if (!fs.existsSync(transcriptsDir))
    fs.mkdirSync(transcriptsDir, { recursive: true });

  const videos = await searchDiseaseVideos(query);
  const limitedVideos = videos.slice(0, 20); // Limit to 20 videos

  for (const video of limitedVideos) {
    const filePath = path.join(transcriptsDir, `${video.id}.txt`);
    fs.writeFileSync(filePath, video.transcript, "utf8");
    console.log(`Saved transcript: ${filePath}`);
  }

  console.log(`Transcripts saved in ${transcriptsDir}`);
}

const query = process.argv.slice(2).join(" ");
if (!query) {
  console.error("Usage: ts-node fetch-transcripts.ts <query>");
  process.exit(1);
}

fetchAndSaveTranscripts(query);
