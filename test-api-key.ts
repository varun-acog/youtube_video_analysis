// test-api-key.ts
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) throw new Error("YOUTUBE_API_KEY not found in .env");

const youtube = google.youtube({
  version: "v3",
  auth: apiKey,
});

async function testApiKey() {
  try {
    const response = await youtube.search.list({
      part: ["snippet"],
      q: "test",
      type: ["video"],
      maxResults: 1,
    });
    console.log("API Key is valid:", response.data.items?.length > 0);
  } catch (error) {
    console.error("API Key test failed:", error);
  }
}

testApiKey().catch(console.error);
