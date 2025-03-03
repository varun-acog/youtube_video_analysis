import { google } from "googleapis";
import { YoutubeTranscript } from "youtube-transcript";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  transcript: string;
}

// Overload to support both return types
export async function searchDiseaseVideos(
  query: string,
  maxResults?: number,
  retries?: number
): Promise<VideoMetadata[]>;
export async function searchDiseaseVideos(
  query: string,
  maxResults: number,
  retries: number,
  pageToken: string | undefined
): Promise<{ videos: VideoMetadata[]; nextPageToken?: string }>;

export async function searchDiseaseVideos(
  query: string,
  maxResults = 10, // Default remains 10 for CLI compatibility
  retries = 3,
  pageToken?: string
): Promise<
  VideoMetadata[] | { videos: VideoMetadata[]; nextPageToken?: string }
> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await youtube.search.list({
        part: ["snippet"],
        q: `${query} disease medical explanation`,
        type: ["video"],
        maxResults: Math.min(maxResults, 50), // Cap at 50 per API call
        pageToken,
      });

      const videos = response.data.items || [];
      const videoMetadata = await Promise.all(
        videos.map(async (video) => {
          const videoId = video.id?.videoId;
          if (!videoId) return null;
          try {
            const transcript = await YoutubeTranscript.fetchTranscript(
              videoId,
              { lang: "en" }
            );
            const transcriptText = transcript
              .map((item) => item.text)
              .join(" ");
            return {
              id: videoId,
              title: video.snippet?.title || "",
              description: video.snippet?.description || "",
              thumbnail: video.snippet?.thumbnails?.high?.url || "",
              transcript: transcriptText,
            };
          } catch (error) {
            console.error(`Transcript error for video ${videoId}:`, error);
            return null;
          }
        })
      ).then((results) =>
        results.filter((result): result is VideoMetadata => result !== null)
      );

      // Return array if no pagination, object if pageToken is provided
      if (pageToken === undefined) {
        return videoMetadata;
      }
      return {
        videos: videoMetadata,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error: any) {
      if (i === retries - 1) {
        throw new Error(`Failed to search videos: ${error.message}`);
      }
      console.warn(`Retry ${i + 1}/${retries} due to error:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return pageToken === undefined ? [] : { videos: [] };
}
