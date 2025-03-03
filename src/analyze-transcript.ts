import fs from "fs";
import path from "path";
import { analyzeTranscript } from "../lib/ollama.js"; // Assume this sends to LLM

async function analyzeFolder(folderPath: string) {
  // Check if folder exists, create if necessary
  if (!fs.existsSync(folderPath)) {
    console.warn(`⚠️ Folder not found: ${folderPath}. Creating it...`);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ Folder created: ${folderPath}`);
  }

  // Get transcript files
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".txt"));

  if (files.length === 0) {
    console.error("❌ No transcript files found in the folder.");
    process.exit(1);
  }

  console.log(`📂 Found ${files.length} transcript(s) in ${folderPath}`);

  // Process each transcript
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    console.log(`🔍 Analyzing transcript: ${filePath}`);

    try {
      if (!fs.existsSync(filePath)) {
        console.error(`⚠️ File not found: ${filePath}`);
        continue;
      }

      let transcript = fs.readFileSync(filePath, "utf8").trim();

      if (!transcript) {
        console.error(`⚠️ Empty transcript file: ${filePath}`);
        continue;
      }

      console.log(`📝 Transcript preview:\n${transcript.slice(0, 100)}...\n`); // Show first 100 chars

      const response = await analyzeTranscript(transcript);

      console.log(
        `🤖 LLM Response for ${file}:\n${JSON.stringify(response, null, 2)}\n`
      );
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error);
    }
  }
}

async function main() {
  const diseaseName = process.argv[2]?.trim();
  if (!diseaseName) {
    console.error("❌ Usage: npx tsx src/analyze-transcript.ts <disease_name>");
    process.exit(1);
  }

  const folderPath = path.join(process.cwd(), "transcripts", diseaseName);
  await analyzeFolder(folderPath);
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
