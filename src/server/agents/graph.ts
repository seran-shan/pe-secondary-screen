import { StateGraph } from "@langchain/langgraph";
import { GraphState } from "./state";
import { finderNode } from "./nodes/finder";
import { crawlerNode } from "./nodes/crawler";
import { extractorNode } from "./nodes/extractor";
import { normalizerNode } from "./nodes/normalizer";
import { writerNode } from "./nodes/writer";
import { enricherNode } from "./nodes/enricher";

// Build the graph skeleton
const builder = new StateGraph(GraphState)
  .addNode("Finder", finderNode)
  .addNode("Crawler", crawlerNode)
  .addNode("Extractor", extractorNode)
  .addNode("Normalizer", normalizerNode)
  .addNode("Enricher", enricherNode)
  .addNode("Writer", writerNode)
  .addEdge("Finder", "Crawler")
  .addEdge("Crawler", "Extractor")
  .addEdge("Extractor", "Normalizer")
  .addEdge("Normalizer", "Enricher")
  .addEdge("Enricher", "Writer")
  .addEdge("Writer", "__end__")
  .addEdge("__start__", "Finder");

export const agentGraph = builder.compile();
