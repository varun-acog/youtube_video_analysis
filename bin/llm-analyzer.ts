#!/usr/bin/env -S npx tsx

import { analyzeTranscript } from "../lib/ollama";
import { getAllVideoIds, initializeDatabase } from "../lib/database";
import dotenv from "dotenv";
import path from "path";
import { safeLog } from "../lib/logger";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

async function main() {
  let inputData = "";

  try {
    // Read all input data as a Promise
    const inputPromise = new Promise((resolve) => {
      let data = '';
      
      process.stdin.on('data', chunk => {
        data += chunk;
      });
      
      process.stdin.on('end', () => {
        resolve(data);
      });
    });

    // Wait for all input with a longer timeout
    inputData = await Promise.race([
      inputPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for input")), 30000))
    ]) as string;

    if (!inputData.trim()) {
      safeLog("error", "❌ Error: No input data received from youtube-fetcher.");
      process.exit(1);
    }

    let videoIds: string[];
    try {
      safeLog("error", "[DEBUG] Parsing input JSON...");
      videoIds = JSON.parse(inputData);
      if (!Array.isArray(videoIds)) {
        throw new Error("Invalid input: expected an array of video IDs");
      }
      safeLog("error", `[DEBUG] Successfully parsed ${videoIds.length} video IDs: ${videoIds.slice(0, 5)}...`);
    } catch (parseError) {
      safeLog("error", "❌ Error parsing input JSON:", (parseError as Error).message);
      safeLog("error", "Received data:", inputData);
      process.exit(1);
    }

    // Initialize the database
    await initializeDatabase();

    safeLog("error", `🔍 Analyzing transcripts for ${videoIds.length} videos...`);

    // Analyze each video's transcript
    const analyses = await Promise.all(
      videoIds.map(async (videoId, index) => {
        try {
          safeLog("error", `Analyzing video ${index + 1}/${videoIds.length} (ID: ${videoId})`);
          const result = await analyzeTranscript(videoId);
          safeLog("error", `[DEBUG] Analysis result for ${videoId}:`, JSON.stringify(result, null, 2));
          return result;
        } catch (error) {
          safeLog("error", `❌ Error analyzing video ${videoId}:`, (error as Error).message);
          return null;
        }
      })
    );

    // Filter out null results
    const validAnalyses = analyses.filter((a): a is NonNullable<typeof a> => a !== null);

    if (validAnalyses.length === 0) {
      safeLog("error", "❗ No valid analyses could be generated.");
      process.exit(1);
    }

    safeLog("error", `✅ Successfully analyzed ${validAnalyses.length} videos`);
    console.log(JSON.stringify(validAnalyses, null, 2));
    process.exit(0);
  } catch (error) {
    safeLog("error", "❌ Error in analysis process:", (error as Error).message);
    process.exit(1);
  }
}

main().catch((error) => {
  safeLog("error", "🚨 Unhandled error:", (error as Error).message);
  process.exit(1);
});
