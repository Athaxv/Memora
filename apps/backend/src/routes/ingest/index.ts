import type { FastifyInstance } from "fastify";
import { ingestSchema } from "@repo/validators";
import { ingest } from "@repo/ingestion";
import { db } from "../../db";
import { config } from "../../config";
import { uploadAssetToR2 } from "../../services/asset-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

function normalizeMimeType(fileName: string, mimeType: string): string {
  if (mimeType !== "application/octet-stream") return mimeType;

  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "pdf") return "application/pdf";
  if (ext === "txt") return "text/plain";
  if (ext === "md") return "text/markdown";
  if (ext === "csv") return "text/csv";
  if (ext === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return mimeType;
}

function getMultipartField(fields: Record<string, unknown> | undefined, name: string) {
  const field = fields?.[name];
  if (field && typeof field === "object" && "value" in field) {
    const value = (field as { value?: unknown }).value;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

function parseTags(value: string | undefined): string[] | undefined {
  const tags = value
    ?.split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags?.length ? tags : undefined;
}

function parseMetadata(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

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
          createdFrom: input.createdFrom,
          metadata: input.metadata,
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

      const normalizedMimeType = normalizeMimeType(file.filename, file.mimetype);

      if (!ALLOWED_TYPES.has(normalizedMimeType)) {
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

      const tags = parseTags(getMultipartField(file.fields, "tags"));
      const title = getMultipartField(file.fields, "title");
      const createdFrom = getMultipartField(file.fields, "createdFrom") as
        | "vault"
        | "chat"
        | "onboarding"
        | "profile"
        | "api"
        | undefined;
      const metadata = parseMetadata(getMultipartField(file.fields, "metadata"));
      const uploadedAsset = await uploadAssetToR2({
        userId,
        fileName: file.filename,
        mimeType: normalizedMimeType,
        buffer,
      });

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
          title: title || file.filename.replace(/\.[^.]+$/, ""),
          tags,
          fileName: file.filename,
          mimeType: normalizedMimeType,
          fileBuffer: buffer,
          fileSize: buffer.length,
          createdFrom,
          metadata: {
            ...(metadata ?? {}),
            assetStorageProvider: uploadedAsset.storageProvider,
            assetObjectKey: uploadedAsset.objectKey,
            assetPublicUrl: uploadedAsset.publicUrl,
            assetMimeType: uploadedAsset.mimeType,
            assetSize: uploadedAsset.size,
            assetOriginalName: uploadedAsset.name,
          },
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
