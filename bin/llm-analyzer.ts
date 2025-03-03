#!/usr/bin/env ts-node

import { analyzeTranscript } from "../lib/ollama.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  let inputData = "";

  process.stdin.on("data", (chunk) => {
    inputData += chunk;
  });

  process.stdin.on("end", async () => {
    try {
      if (!inputData.trim()) {
        console.error("Error: No input data received.");
        process.exit(1);
      }

      let videos;
      try {
        videos = JSON.parse(inputData);
      } catch (parseError: any) {
        console.error("Error parsing input JSON:", parseError.message);
        console.error("Received data:", inputData);
        process.exit(1);
      }

      if (!Array.isArray(videos)) {
        console.error("Error: Expected an array of videos.");
        process.exit(1);
      }

      const analyses = await Promise.all(
        videos.map(async (video) => {
          try {
            return await analyzeTranscript(video);
          } catch (error: any) {
            console.error(
              `Error analyzing video ${video.id || "unknown"}:`,
              error.message
            );
            return null; // Skip failed analyses
          }
        })
      );

      // Filter out null results
      const validAnalyses = analyses.filter((a) => a !== null);
      console.log(JSON.stringify(validAnalyses, null, 2));
    } catch (error: any) {
      console.error("Error in llm-analyzer:", error.message);
      process.exit(1);
    }
  });

  process.stdin.on("error", (error) => {
    console.error("Stdin error:", error.message);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error("Unhandled error:", error.message);
  process.exit(1);
});
