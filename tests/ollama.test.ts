// import { analyzeTranscript, AnalysisResult } from "../lib/ollama"; // Adjust the path if needed
// import { VideoMetadata } from "../lib/youtube"; // Adjust the path if needed
// import myLama from "../lib/MyLama";

// // ✅ Manually Mock `MyLama.generate`
// (myLama as any).generate = async (prompt: string) => {
//   console.log("📢 Mocked LLM Prompt:", prompt); // Debugging prompt

//   return JSON.stringify({
//     // ✅ Convert to JSON string
//     diseaseName: "Diabetes",
//     symptoms: [
//       "Frequent urination",
//       "Increased thirst",
//       "Unexplained weight loss",
//     ],
//     treatments: ["Insulin therapy", "Diet control", "Exercise"],
//     keyTakeaways: ["Early diagnosis helps", "Regular exercise is beneficial"],
//     relevanceScore: 85,
//   });
// };

// // ✅ Run Test
// (async () => {
//   console.log("\n🚀 Running Ollama Test...\n");

//   const mockVideo: VideoMetadata = {
//     id: "abc123",
//     title: "Understanding Diabetes",
//     transcript:
//       "Diabetes is a chronic condition that affects insulin production...",
//     description: "A detailed explanation of diabetes and its management.", // ✅ Added description
//     thumbnail: "https://example.com/diabetes-thumbnail.jpg", // ✅ Added thumbnail
//   };

//   try {
//     const result: AnalysisResult = await analyzeTranscript(mockVideo);
//     console.log("🟢 LLM Raw Response:", result); // Logs full response for debugging

//     // ✅ Assertions
//     const isCorrect =
//       result.diseaseName === "Diabetes" &&
//       result.symptoms.includes("Frequent urination") &&
//       result.treatments.includes("Insulin therapy") &&
//       result.keyTakeaways.includes("Early diagnosis helps") &&
//       result.relevanceScore === 85;

//     if (isCorrect) {
//       console.log("✅ Test Passed: Analysis result is correct!");
//     } else {
//       console.error("❌ Test Failed: Analysis result is incorrect!");
//     }
//   } catch (error) {
//     console.error("❌ Test Error:", error);
//   }
// })();
// test-llm.ts
import myLama from "./lib/MyLama";

async function testLLM() {
  const prompt = `
You are an expert assistant. Given the transcript "Patient John Doe, 45 years old, male, from New York, discusses his cystic fibrosis diagnosis.", classify it into one of the following categories:
  1. "patient story"
  2. "KOL interview"
  3. "Informational"

Provide the response in JSON format with the following keys:
  - "video_type"
  - "name"
  - "age"
  - "sex"
  - "location"

If any data is unavailable, set its value to null.
  `;
  try {
    const response = await myLama.generate(prompt);
    console.log("LLM Response:", response);
    const jsonMatch = response.match(/{[\s\S]*}/);
    if (jsonMatch) {
      console.log("Parsed JSON:", JSON.parse(jsonMatch[0]));
    } else {
      console.error("No valid JSON found in response");
    }
  } catch (error) {
    console.error("LLM Error:", error);
  }
}

testLLM();