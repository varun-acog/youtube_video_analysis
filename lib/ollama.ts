// lib/ollama.ts
import myLama from "./MyLama";
import { getVideoMetadata, getTranscript, storeAnalysis } from "./database";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { safeLog } from "./logger";
import path from "path";

let DISEASE_SPACE_PROMPT: string;

// Load prompt template once
try {
  const promptLibraryPath = path.join(process.cwd(), "prompt_library.yaml");
  safeLog("error", `[DEBUG] Loading prompt from: ${promptLibraryPath}`);
  const promptLibrary = yaml.load(fs.readFileSync(promptLibraryPath, "utf8")) as any;
  DISEASE_SPACE_PROMPT = promptLibrary.disease_space.prompt;
  if (!DISEASE_SPACE_PROMPT) {
    throw new Error("disease_space.prompt not found in prompt_library.yaml");
  }
} catch (error) {
  safeLog("error", "❌ Error loading prompt template:", error);
  process.exit(1);
}

export interface AnalysisResult {
  video_type: string;
  name: string | null;
  age: string | null;
  sex: string | null;
  location: string | null;
  symptoms: string[] | null;
  medicalHistoryOfPatient: Record<string, any> | null;
  familyMedicalHistory: Record<string, any> | null;
  challengesFacedDuringDiagnosis: string[] | null;
  key_opinion: string | null;
}

export async function analyzeTranscript(videoId: string): Promise<AnalysisResult | null> {
  safeLog("error", `[DEBUG] Starting analysis for video ${videoId}...`);

  try {
    // Fetch video metadata
    const video = await getVideoMetadata(videoId);
    if (!video) {
      safeLog("error", `❌ Video ${videoId} not found in database`);
      return null;
    }
    safeLog("error", `[DEBUG] Found video: ${video.title}`);

    // Fetch transcript
    const transcriptData = await getTranscript(videoId);
    if (!transcriptData) {
      safeLog("error", `❌ No transcript found for video ${videoId}`);
      return null;
    }
    safeLog("error", `[DEBUG] Found transcript of length: ${transcriptData.fullTranscript.length}`);

    // Prepare prompt
    const structuredPrompt = DISEASE_SPACE_PROMPT
      .replace("{title}", video.title)
      .replace("{transcript}", transcriptData.fullTranscript);

    // Generate LLM response
    safeLog("error", "[DEBUG] Sending to LLM...");
    const content = await myLama.generate(structuredPrompt);
    safeLog("error", "[DEBUG] Raw LLM response:", content);

    // Parse JSON from response
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in LLM response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    safeLog("error", "[DEBUG] Parsed JSON:", JSON.stringify(parsedData, null, 2));

    // Structure the analysis result
    const analysisResult: AnalysisResult = {
      video_type: parsedData.video_type || "Informational",
      name: parsedData.name || null,
      age: parsedData.age || null,
      sex: parsedData.sex || null,
      location: parsedData.location || null,
      symptoms: Array.isArray(parsedData.symptoms) ? parsedData.symptoms : null,
      medicalHistoryOfPatient: typeof parsedData.medicalHistoryOfPatient === "object" ? parsedData.medicalHistoryOfPatient : null,
      familyMedicalHistory: typeof parsedData.familyMedicalHistory === "object" ? parsedData.familyMedicalHistory : null,
      challengesFacedDuringDiagnosis: Array.isArray(parsedData.challengesFacedDuringDiagnosis) ? parsedData.challengesFacedDuringDiagnosis : null,
      key_opinion: parsedData.key_opinion || null
    };

    // Store analysis
    await storeAnalysis(videoId, analysisResult);
    safeLog("error", `✅ Analysis stored for video ${videoId}`);

    return analysisResult;

  } catch (error) {
    safeLog("error", `❌ Error analyzing video ${videoId}:`, error);
    return null;
  }
}
