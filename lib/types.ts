export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  transcript: string;
}

export interface SearchOptions {
  maxResults?: number;
  language?: string;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}