import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";
const PRIMARY_BOT = (process.env.PRIMARY_BOT || "telegram") as "telegram" | "whatsapp" | "both";

const JWT_SECRET = required("JWT_SECRET");
const COOKIE_SECRET = process.env.COOKIE_SECRET || JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

if (IS_PROD) {
  if (!process.env.COOKIE_SECRET) {
    throw new Error("Missing required env var in production: COOKIE_SECRET");
  }
  if (COOKIE_SECRET === JWT_SECRET) {
    throw new Error("COOKIE_SECRET must be different from JWT_SECRET in production");
  }
  if (!process.env.FRONTEND_URL) {
    throw new Error("Missing required env var in production: FRONTEND_URL");
  }

  if (PRIMARY_BOT === "whatsapp" || PRIMARY_BOT === "both") {
    required("WHATSAPP_VERIFY_TOKEN");
    required("WHATSAPP_APP_SECRET");
    required("WHATSAPP_ACCESS_TOKEN");
    required("WHATSAPP_PHONE_NUMBER_ID");
  }

  if (PRIMARY_BOT === "telegram" || PRIMARY_BOT === "both") {
    required("TELEGRAM_BOT_TOKEN");
    required("TELEGRAM_WEBHOOK_SECRET");
  }
}

export const config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV,
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET,
  COOKIE_SECRET,
  ACCESS_TOKEN_TTL_SECONDS: 15 * 60, // 15 minutes
  REFRESH_TOKEN_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 days
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  GROQ_API_KEY: required("GROQ_API_KEY"),
  HF_API_KEY: process.env.HF_API_KEY || undefined,
  FRONTEND_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/auth/google/callback",
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || "",
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || "",
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || "",
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  PRIMARY_BOT,
};
