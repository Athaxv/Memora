import { createDb } from "@repo/db/client";
import { config } from "./config";

export const db = createDb(config.DATABASE_URL);
