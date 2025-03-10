import { analyzeTranscript } from "../lib/ollama";
import { safeLog } from "../lib/logger";

async function testLLM() {
  // Test with a known video ID from your database
  const videoId = "HrkdWzBqtFs"; // Replace with an actual video ID from your database
  
  try {
    safeLog("error", "🔍 Testing LLM analysis...");
    const result = await analyzeTranscript(videoId);
    
    if (result) {
      safeLog("error", "✅ Analysis successful!");
      safeLog("error", "Result:", JSON.stringify(result, null, 2));
    } else {
      safeLog("error", "❌ Analysis failed!");
    }
  } catch (error) {
    safeLog("error", "❌ Error during analysis:", error);
  }
}

testLLM().catch(console.error);