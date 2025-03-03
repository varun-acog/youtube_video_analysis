import { google } from "googleapis";
import { VideoMetadata, SearchOptions } from "./types.js";
import { TranscriptService } from "./transcript-service.js";

export class YouTubeService {
  private youtube;
  private transcriptService: TranscriptService;

  constructor(apiKey: string) {
    this.youtube = google.youtube("v3");
    this.transcriptService = new TranscriptService();
  }

  async searchVideos(
    query: string,
    options: SearchOptions = {}
  ): Promise<VideoMetadata[]> {
    try {
      const response = await this.youtube.search.list({
        part: ["snippet"],
        q: `${query} medical explanation`,
        type: ["video"],
        maxResults: options.maxResults || 10,
        order: options.order || "relevance",
        key: process.env.YOUTUBE_API_KEY,
      });

      const videos = response.data.items || [];
      return Promise.all(
        videos.map(async (video) => {
          const videoId = video.id?.videoId;
          if (!videoId) return null;

          try {
            const transcript = await this.transcriptService.getTranscript(
              videoId
            );

            return {
              id: videoId,
              title: video.snippet?.title || "",
              description: video.snippet?.description || "",
              thumbnail: video.snippet?.thumbnails?.high?.url || "",
              transcript: transcript.join(" "),
            };
          } catch (error) {
            console.error(
              `Error fetching transcript for video ${videoId}:`,
              error
            );
            return null;
          }
        })
      ).then((results) =>
        results.filter((result): result is VideoMetadata => result !== null)
      );
    } catch (error) {
      console.error("Error searching videos:", error);
      throw error;
    }
  }

  async getVideoDetails(videoId: string): Promise<VideoMetadata | null> {
    try {
      const response = await this.youtube.videos.list({
        part: ["snippet"],
        id: [videoId],
        key: process.env.YOUTUBE_API_KEY,
      });

      const video = response.data.items?.[0];
      if (!video) return null;

      const transcript = await this.transcriptService.getTranscript(videoId);

      return {
        id: videoId,
        title: video.snippet?.title || "",
        description: video.snippet?.description || "",
        thumbnail: video.snippet?.thumbnails?.high?.url || "",
        transcript: transcript.join(" "),
      };
    } catch (error) {
      console.error("Error fetching video details:", error);
      return null;
    }
  }
}
