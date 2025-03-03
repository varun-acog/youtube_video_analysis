#!/usr/bin/env -S ts-node --loader ts-node/esm

console.log("Script starting"); // Debug: Before imports

import { searchDiseaseVideos } from "../lib/youtube"; // Fixed import
import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

console.log("Imported dependencies"); // Debug: After imports

// Load environment variables safely
dotenv.config();
if (!process.env.YOUTUBE_API_KEY) {
  console.error("Error: YOUTUBE_API_KEY is missing from .env file!");
  process.exit(1);
}
console.log("dotenv configured successfully"); // Debug

async function fetchVideos(query: string, numRecords: number) {
  console.log(`Fetching ${numRecords} videos for "${query}"`);

  try {
    const videos = await searchDiseaseVideos(query, numRecords);

    if (!videos || videos.length === 0) {
      console.error("No videos found. Check query or API limits.");
      process.exit(1);
    }

    console.log("Videos fetched successfully");
    console.log(JSON.stringify(videos, null, 2)); // Print videos as JSON
  } catch (error: any) {
    console.error(
      "Error fetching videos:",
      error.message || error,
      error.stack || ""
    );
    process.exit(1);
  }
}

async function main() {
  try {
    const argv = yargs(hideBin(process.argv))
      .usage("Usage: youtube-fetcher -n <number-of-records> <keywords>")
      .option("n", {
        alias: "numRecords",
        type: "number",
        description: "Number of records to fetch (max 50)",
        default: 50,
      })
      .demandCommand(1, "Please provide search keywords")
      .help()
      .parseSync();

    console.log("Parsed arguments:", argv);

    const numRecords = Math.min(argv.n, 50);
    const query = argv._.join(" ");

    if (isNaN(numRecords) || numRecords <= 0) {
      console.error("Error: -n must be a positive integer.");
      process.exit(1);
    }

    await fetchVideos(query, numRecords);
  } catch (error: any) {
    console.error("Error in main:", error.message || error, error.stack || "");
    process.exit(1);
  }
}

// Global error handling
process.on("unhandledRejection", (reason: any, promise) => {
  console.error(
    "Global unhandled rejection:",
    reason.message || reason,
    reason.stack || ""
  );
  process.exit(1);
});

// Run script
main().catch((error: any) => {
  console.error(
    "Unhandled error in youtube-fetcher:",
    error.message || error,
    error.stack || ""
  );
  process.exit(1);
});
