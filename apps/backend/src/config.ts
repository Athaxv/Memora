import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  GROQ_API_KEY: required("GROQ_API_KEY"),
  HF_API_KEY: process.env.HF_API_KEY || undefined,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};
