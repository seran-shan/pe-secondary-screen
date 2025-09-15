import { StateGraph } from "@langchain/langgraph";
import { GraphState } from "./state";
import { finderNode } from "./nodes/finder";
import { extractorNode } from "./nodes/extractor";
import { normalizerNode } from "./nodes/normalizer";
import { writerNode } from "./nodes/writer";

// Build the graph skeleton
const builder = new StateGraph(GraphState)
  .addNode("Finder", finderNode)
  .addNode("Extractor", extractorNode)
  .addNode("Normalizer", normalizerNode)
  .addNode("Writer", writerNode)
  .addEdge("Finder", "Extractor")
  .addEdge("Extractor", "Normalizer")
  .addEdge("Normalizer", "Writer")
  .addEdge("Writer", "__end__")
  .addEdge("__start__", "Finder");

export const agentGraph = builder.compile();
