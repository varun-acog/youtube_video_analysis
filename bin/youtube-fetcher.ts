import { searchDiseaseVideos, getTranscript } from "../lib/youtube";
import { initializeDatabase, storeVideo, storeTranscript } from "../lib/database";
import { safeLog } from "../lib/logger";

async function main() {
  const disease = process.argv[2];
  if (!disease) {
    safeLog("error", "Usage: youtube-fetcher.ts <disease_name>");
    process.exit(1);
  }

  try {
    // Initialize database
    await initializeDatabase();

    // Fetch videos
    const videos = await searchDiseaseVideos(disease);
    safeLog("error", `Found ${videos.length} videos for "${disease}"`);

    // Store each video and its transcript
    for (const video of videos) {
      try {
        // Store video metadata
        await storeVideo(video);
        
        // Fetch and store transcript
        const transcript = await getTranscript(video.id);
        if (transcript) {
          await storeTranscript(video.id, transcript, 'en');
          safeLog("error", `✅ Stored transcript for video ${video.id}`);
        } else {
          safeLog("error", `⚠️ No transcript available for video ${video.id}`);
        }
      } catch (error) {
        safeLog("error", `❌ Error processing video ${video.id}:`, error);
      }
    }

    // Output video IDs for the pipeline
    console.log(JSON.stringify(videos.map(v => v.id)));
    
  } catch (error) {
    safeLog("error", "❌ Error:", error);
    process.exit(1);
  }
}

main().catch(console.error);
