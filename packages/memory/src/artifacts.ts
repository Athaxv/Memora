import { ulid } from "ulid";
import { artifacts } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import type { Artifact, CreateArtifactInput } from "./types";

export async function createArtifact(
  db: Database,
  input: CreateArtifactInput
): Promise<Artifact> {
  const [artifact] = await db
    .insert(artifacts)
    .values({
      id: ulid(),
      userId: input.userId,
      type: input.type,
      rawContent: input.rawContent,
      source: input.source,
      sourceRef: input.sourceRef,
      metadata: input.metadata,
      embedding: input.embedding,
    })
    .returning();

  return artifact!;
}
