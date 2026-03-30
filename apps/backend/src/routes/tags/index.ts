import type { FastifyInstance } from "fastify";
import { getTagsForUser } from "@repo/graph";
import { db } from "../../db";

export async function tagsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // GET /tags — all tags for authenticated user
  app.get("/", async (request, reply) => {
    const { id: userId } = request.user;
    const tags = await getTagsForUser(db, userId);
    return reply.send({ tags });
  });
}
