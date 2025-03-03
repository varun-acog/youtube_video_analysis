import { YoutubeTranscript } from "youtube-transcript";

export class TranscriptService {
  async getTranscript(videoId: string): Promise<string[]> {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      return transcript.map((segment) => segment.text);
    } catch (error) {
      console.error(`Error fetching transcript for video ${videoId}:`, error);
      throw error;
    }
  }

  async getTranscriptWithTimestamps(videoId: string) {
    try {
      return await YoutubeTranscript.fetchTranscript(videoId);
    } catch (error) {
      console.error(
        `Error fetching transcript with timestamps for video ${videoId}:`,
        error
      );
      throw error;
    }
  }
}
