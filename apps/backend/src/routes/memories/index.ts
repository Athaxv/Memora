import type { FastifyInstance } from "fastify";
import {
  listNodes,
  getNode,
  updateNode,
  softDeleteNode,
  getTagsForNode,
  getRelatedNodes,
  semanticSearch,
} from "@repo/graph";
import { generateEmbedding } from "@repo/ai/embeddings";
import {
  updateNodeSchema,
  searchSchema,
  memoryGraphQuerySchema,
} from "@repo/validators";
import { db } from "../../db";
import { config } from "../../config";
import { getMemoryGraph } from "../../services/memory-graph";

export async function memoriesRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook("preHandler", app.authenticate);

  // GET /memories — list with pagination and filters
  app.get("/", async (request, reply) => {
    const { id: userId } = request.user;
    const query = request.query as Record<string, string | undefined>;

    const cursor = query.cursor ?? undefined;
    const limit = Math.min(parseInt(query.limit ?? "20", 10), 50);
    const type = query.type ?? undefined;
    const search = query.q ?? undefined;
    const dateFrom = query.from ? new Date(query.from) : undefined;
    const dateTo = query.to ? new Date(query.to) : undefined;

    const result = await listNodes(db, userId, {
      cursor,
      limit,
      type,
      search,
      dateFrom,
      dateTo,
    });

    return reply.send(result);
  });

  // POST /memories/search — semantic search
  app.post("/search", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { query, limit, type } = searchSchema.parse(request.body);

      const queryEmbedding = await generateEmbedding(
        query,
        config.HF_API_KEY,
        "query"
      );

      if (!queryEmbedding) {
        return reply
          .code(501)
          .send({ error: "Semantic search requires HF_API_KEY for embeddings" });
      }

      const results = await semanticSearch(db, userId, queryEmbedding, {
        limit,
        type,
      });

      return reply.send({
        results: results.map((r) => ({
          node: {
            id: r.node.id,
            title: r.node.title,
            summary: r.node.summary,
            type: r.node.type,
            source: r.node.source,
            createdAt: r.node.createdAt,
          },
          similarity: r.similarity,
        })),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Search failed" });
    }
  });

  // GET /memories/graph — memory nodes + relationship edges for visualization
  app.get("/graph", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const query = memoryGraphQuerySchema.parse(request.query ?? {});

      const graph = await getMemoryGraph(db, userId, {
        limit: query.limit,
        edgeLimitPerNode: query.edgeLimitPerNode,
        tag: query.tag,
        from: query.from,
        to: query.to,
      });

      return reply.send(graph);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid query" });
      }

      request.log.error(error);
      return reply.code(500).send({ error: "Failed to build graph" });
    }
  });

  // GET /memories/:id — single memory with tags and related
  app.get("/:id", async (request, reply) => {
    const { id: userId } = request.user;
    const { id } = request.params as { id: string };

    const node = await getNode(db, id, userId);
    if (!node) {
      return reply.code(404).send({ error: "Not found" });
    }

    const [nodeTags, related] = await Promise.all([
      getTagsForNode(db, id),
      getRelatedNodes(db, id, userId, 10),
    ]);

    return reply.send({
      ...node,
      tags: nodeTags,
      related: related.map((r) => ({
        node: {
          id: r.node.id,
          title: r.node.title,
          summary: r.node.summary,
          type: r.node.type,
          createdAt: r.node.createdAt,
        },
        edgeType: r.edgeType,
        weight: r.weight,
      })),
    });
  });

  // PATCH /memories/:id — update
  app.patch("/:id", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { id } = request.params as { id: string };
      const input = updateNodeSchema.parse(request.body);

      const node = await updateNode(db, id, userId, input);
      if (!node) {
        return reply.code(404).send({ error: "Not found" });
      }

      return reply.send(node);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /memories/:id — soft delete
  app.delete("/:id", async (request, reply) => {
    const { id: userId } = request.user;
    const { id } = request.params as { id: string };

    const deleted = await softDeleteNode(db, id, userId);
    if (!deleted) {
      return reply.code(404).send({ error: "Not found" });
    }

    return reply.send({ success: true });
  });
}
