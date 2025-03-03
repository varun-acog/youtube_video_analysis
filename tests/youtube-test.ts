import { YouTubeService } from "../lib/youtube-service.js";
import dotenv from "dotenv";

dotenv.config();

async function testYouTubeService() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not found in environment variables");
  }

  const youtubeService = new YouTubeService(apiKey);

  try {
    console.log("Testing video search...");
    const videos = await youtubeService.searchVideos("trichotillomania", {
      maxResults: 3,
    });
    console.log("Found videos:", videos.length);
    console.log("First video:", JSON.stringify(videos[0], null, 2));

    if (videos.length > 0) {
      console.log("\nTesting video details...");
      const videoDetails = await youtubeService.getVideoDetails(videos[0].id);
      console.log("Video details:", JSON.stringify(videoDetails, null, 2));
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testYouTubeService().catch(console.error);
