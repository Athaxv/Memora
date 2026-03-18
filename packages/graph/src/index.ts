export {
  createNode,
  getNode,
  listNodes,
  updateNode,
  softDeleteNode,
} from "./nodes.js";

export {
  computeSemanticEdges,
  createEdge,
  getEdgesForNode,
} from "./edges.js";

export { getRelatedNodes } from "./traversal.js";

export { semanticSearch } from "./search.js";

export {
  upsertTags,
  addTagsToNode,
  getTagsForUser,
  getTagsForNode,
  removeTagFromNode,
} from "./tags.js";

export type {
  Node,
  NewNode,
  Edge,
  NewEdge,
  Tag,
  ListNodesOptions,
  ListNodesResult,
  SearchResult,
  CreateNodeInput,
  UpdateNodeInput,
} from "./types.js";
