import * as dotenv from "dotenv";
import myLama from "./MyLama";
import { VideoMetadata } from "./youtube";

dotenv.config();

export interface AnalysisResult {
  diseaseName: string;
  symptoms: string[];
  treatments: string[];
  keyTakeaways: string[];
  relevanceScore: number;
}

export async function analyzeTranscript(
  video: VideoMetadata
): Promise<AnalysisResult> {
  const promptTemplate = process.env.PROMPT_TEMPLATE;
  if (!promptTemplate) {
    throw new Error("PROMPT_TEMPLATE is missing in .env file");
  }

  const structuredPrompt = promptTemplate.replace(
    "{TRANSCRIPT}",
    video.transcript
  );

  try {
    const content = await myLama.generate(structuredPrompt);
    console.log("Raw LLM Response:", content);

    let parsedData: any;
    // Extract JSON directly, as the LLM might include extra text
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (jsonMatch) {
      parsedData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No valid JSON found in response");
    }

    return {
      diseaseName: parsedData.diseaseName || "Unknown",
      symptoms: Array.isArray(parsedData.symptoms) ? parsedData.symptoms : [],
      treatments: Array.isArray(parsedData.treatments)
        ? parsedData.treatments
        : [],
      keyTakeaways: Array.isArray(parsedData.keyTakeaways)
        ? parsedData.keyTakeaways
        : [],
      relevanceScore:
        typeof parsedData.relevanceScore === "number" &&
        parsedData.relevanceScore >= 0 &&
        parsedData.relevanceScore <= 100
          ? parsedData.relevanceScore
          : 0,
    };
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    throw new Error(
      `Failed to analyze transcript: ${(error as Error).message}`
    );
  }
}
