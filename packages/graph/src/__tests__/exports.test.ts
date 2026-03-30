import { describe, it, expect } from "vitest";
import * as graphExports from "../index";

describe("@repo/graph exports", () => {
  const expectedFunctions = [
    "createNode",
    "getNode",
    "listNodes",
    "updateNode",
    "softDeleteNode",
    "computeSemanticEdges",
    "createEdge",
    "getEdgesForNode",
    "semanticSearch",
    "getRelatedNodes",
    "upsertTags",
    "addTagsToNode",
    "getTagsForUser",
    "getTagsForNode",
    "removeTagFromNode",
  ] as const;

  it.each(expectedFunctions)("exports %s as a function", (name) => {
    expect(graphExports).toHaveProperty(name);
    expect(typeof (graphExports as Record<string, unknown>)[name]).toBe(
      "function"
    );
  });

  it("exports exactly the expected set of functions", () => {
    const exportedFunctions = Object.entries(graphExports)
      .filter(([, value]) => typeof value === "function")
      .map(([key]) => key);

    expect(exportedFunctions.sort()).toEqual([...expectedFunctions].sort());
  });
});
