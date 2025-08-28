import { Client } from "langsmith";
import { env } from "@/env";

// Initialize LangSmith client
export const langsmithClient = new Client({
  apiKey: env.LANGSMITH_API_KEY,
  apiUrl: env.LANGSMITH_ENDPOINT,
});

// Configure LangSmith tracing
export const configureLangSmith = () => {
  if (env.LANGSMITH_API_KEY) {
    process.env.LANGCHAIN_TRACING_V2 = "true";
    process.env.LANGCHAIN_API_KEY = env.LANGSMITH_API_KEY;
    process.env.LANGCHAIN_PROJECT =
      env.LANGSMITH_PROJECT ?? "pe-secondary-screen";

    if (env.LANGSMITH_ENDPOINT) {
      process.env.LANGCHAIN_ENDPOINT = env.LANGSMITH_ENDPOINT;
    }

    console.log("✅ LangSmith tracing enabled");
  } else {
    console.log("⚠️  LangSmith API key not found - tracing disabled");
  }
};

// Helper to create run names for better organization
export const createRunName = (sponsorName: string, mode: string) =>
  `Portfolio Discovery - ${sponsorName} (${mode})`;

// Helper to add metadata to runs
export const createRunMetadata = (sponsorName: string, mode: string) => ({
  sponsor_name: sponsorName,
  mode,
  framework: "langgraph",
  pipeline: "portfolio-discovery",
  version: "1.0.0",
});
