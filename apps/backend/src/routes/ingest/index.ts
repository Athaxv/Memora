import type { FastifyInstance } from "fastify";
import { ingestSchema } from "@repo/validators";
import { ingest } from "@repo/ingestion";
import { db } from "../../db";
import { config } from "../../config";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

export async function ingestRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook("preHandler", app.authenticate);

  // POST /ingest — text or URL ingestion
  app.post("/", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const input = ingestSchema.parse(request.body);

      const result = await ingest(
        {
          db,
          groqApiKey: config.GROQ_API_KEY,
          hfApiKey: config.HF_API_KEY,
        },
        {
          userId,
          type: input.type,
          content: input.content,
          title: input.title,
          tags: input.tags,
        }
      );

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to ingest content" });
    }
  });

  // POST /ingest/upload — file upload (multipart)
  app.post("/upload", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const file = await request.file();

      if (!file) {
        return reply.code(400).send({ error: "No file provided" });
      }

      if (!ALLOWED_TYPES.has(file.mimetype)) {
        return reply
          .code(400)
          .send({ error: `Unsupported file type: ${file.mimetype}` });
      }

      const buffer = await file.toBuffer();

      if (buffer.length > MAX_FILE_SIZE) {
        return reply
          .code(400)
          .send({ error: "File too large. Maximum size is 10MB." });
      }

      // Extract tags from fields if present
      const tagsField = file.fields?.tags;
      let tags: string[] | undefined;
      if (tagsField && "value" in tagsField && typeof tagsField.value === "string") {
        tags = tagsField.value
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
      }

      const result = await ingest(
        {
          db,
          groqApiKey: config.GROQ_API_KEY,
          hfApiKey: config.HF_API_KEY,
        },
        {
          userId,
          type: "file",
          content: file.filename,
          title: file.filename.replace(/\.[^.]+$/, ""),
          tags,
          fileName: file.filename,
          mimeType: file.mimetype,
          fileBuffer: buffer,
        }
      );

      return reply.code(201).send(result);
    } catch (error) {
      request.log.error(error);
      return reply
        .code(500)
        .send({ error: "Failed to process uploaded file" });
    }
  });
}
