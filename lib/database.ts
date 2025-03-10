// lib/database.ts
import pkg from 'pg';
const { Pool } = pkg;
import { safeLog } from './logger';
import { VideoMetadata } from './youtube';

let pool: Pool | null = null;

async function connectWithRetry(retries = 5, retryInterval = 2000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      safeLog("error", `Attempting to connect to database (attempt ${attempt + 1}/${retries})...`);
      const newPool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      await newPool.query('SELECT 1');
      safeLog("error", "Successfully connected to PostgreSQL database!");
      return newPool;
    } catch (error) {
      attempt++;
      safeLog("error", `Database connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt >= retries) {
        safeLog("error", "Max retries reached, giving up on database connection");
        throw error;
      }
      safeLog("error", `Waiting ${retryInterval/1000} seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  throw new Error("Failed to connect to database after multiple attempts");
}

export async function initializeDatabase() {
  try {
    if (!pool) {
      pool = await connectWithRetry();
    }

    // Create videos table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        video_id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        published_date TIMESTAMP NULL,
        duration_seconds INTEGER,
        url TEXT NOT NULL
      )
    `);

    // Create transcripts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transcripts (
        transcript_id SERIAL PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL,
        full_transcript TEXT NOT NULL,
        language VARCHAR(10) NOT NULL,
        FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
      )
    `);

    safeLog("error", "Database initialized successfully");
  } catch (error) {
    safeLog("error", "Error initializing database:", error);
    throw error;
  }
}

export async function storeVideo(metadata: VideoMetadata) {
  try {
    if (!pool) await initializeDatabase();
    
    const query = `
      INSERT INTO videos (video_id, title, description, published_date, duration_seconds, url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (video_id) DO UPDATE 
      SET title = $2, description = $3, published_date = $4, duration_seconds = $5, url = $6
    `;
    
    await pool.query(query, [
      metadata.id,
      metadata.title,
      metadata.description,
      metadata.publishedDate || null,
      metadata.durationInSeconds || null,
      `https://youtube.com/watch?v=${metadata.id}`
    ]);
    
    safeLog("error", `✅ Video metadata stored for ${metadata.id}`);
  } catch (error) {
    safeLog("error", `Error storing metadata for video ${metadata.id}:`, error);
    throw error;
  }
}

export async function storeTranscript(videoId: string, transcript: string, language: string = 'en') {
  try {
    if (!pool) await initializeDatabase();
    
    const query = `
      INSERT INTO transcripts (video_id, full_transcript, language)
      VALUES ($1, $2, $3)
      ON CONFLICT (video_id) DO UPDATE 
      SET full_transcript = $2, language = $3
    `;
    
    await pool.query(query, [videoId, transcript, language]);
    safeLog("error", `✅ Transcript stored for video ${videoId}`);
  } catch (error) {
    safeLog("error", `❌ Error storing transcript for ${videoId}:`, error);
    throw error;
  }
}

export async function getTranscript(videoId: string) {
  try {
    if (!pool) await initializeDatabase();
    
    const query = `
      SELECT full_transcript, language
      FROM transcripts
      WHERE video_id = $1
    `;
    
    const result = await pool.query(query, [videoId]);
    return result.rows[0] || null;
  } catch (error) {
    safeLog("error", `Error fetching transcript for ${videoId}:`, error);
    throw error;
  }
}

export async function getAllVideoIds(): Promise<string[]> {
  try {
    if (!pool) await initializeDatabase();
    const result = await pool.query("SELECT video_id FROM videos");
    return result.rows.map((row: any) => row.video_id);
  } catch (error) {
    safeLog("error", "Error fetching all video IDs:", error);
    throw error;
  }
}

// Interfaces
export interface VideoMetadata {
  id: string; // Video ID (primary key)
  title: string;
  description: string;
  publishedDate: string; // ISO 8601 format (e.g., "2023-01-01T12:00:00Z")
  durationInSeconds: number; // Duration in seconds
  viewCount: number;
  url: string;
}

export interface TranscriptSegment {
  videoId: string;
  fullTranscript: string;
  language: string;
}

// Close the pool when the application shuts down
process.on("SIGTERM", () => pool?.end());
process.on("SIGINT", () => pool?.end());
