// lib/transcript-service.ts
import { YoutubeTranscript } from "youtube-transcript";
import { safeLog } from "./logger";

export class TranscriptService {
  async getTranscript(videoId: string): Promise<string[]> {
    try {
      const { segments } = await this.fetchTranscriptWithFallback(videoId);
      return segments.map((segment) => segment.text);
    } catch (error) {
      safeLog("error", `Error fetching transcript for video ${videoId}:`, error.message);
      throw error;
    }
  }

  async getTranscriptWithTimestamps(
    videoId: string
  ): Promise<{ segments: YoutubeTranscript.Transcript[], language: string }> {
    try {
      return await this.fetchTranscriptWithFallback(videoId);
    } catch (error) {
      safeLog("error", `Error fetching transcript with timestamps for video ${videoId}:`, error.message);
      throw error;
    }
  }

  async getBatchTranscripts(
    videoIds: string[]
  ): Promise<Map<string, string[]>> {
    const transcripts = new Map<string, string[]>();
    for (const videoId of videoIds) {
      try {
        const transcript = await this.getTranscript(videoId);
        transcripts.set(videoId, transcript);
      } catch (error) {
        safeLog("error", `Skipping transcript for video ${videoId}:`, error.message);
        transcripts.set(videoId, []); // Store empty array for missing transcripts
      }
    }
    return transcripts;
  }

  private async fetchTranscriptWithFallback(videoId: string): Promise<{ segments: YoutubeTranscript.Transcript[], language: string }> {
    const languages = ["en", "hi", "es", "fr", "de", "ja"]; // Expanded language list
    let lastError: Error | null = null;
    let availableLanguages: string[] = [];

    for (const lang of languages) {
      try {
        safeLog("error", `[DEBUG] Attempting to fetch transcript for video ${videoId} in language: ${lang}`);
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        if (transcript.length > 0) {
          safeLog("error", `[DEBUG] Successfully fetched transcript for video ${videoId} in language: ${lang} with ${transcript.length} segments`);
          return { segments: transcript, language: lang };
        }
      } catch (error) {
        lastError = error;
        // Collect available languages from the error message, if provided
        const errorMessage = error.message || "";
        if (errorMessage.includes("Available languages:")) {
          const match = errorMessage.match(/Available languages: ([\w\s,]+)$/);
          if (match) {
            availableLanguages = match[1].split(", ").map(lang => lang.trim());
          }
        }
      }
    }

    safeLog("error", `[DEBUG] No transcript available for video ${videoId} after trying all languages. Available languages: ${availableLanguages.length ? availableLanguages.join(", ") : "none"}`);
    throw new Error(`No transcript available for video ${videoId} in any supported language: ${lastError?.message || "Unknown error"}`);
  }
}