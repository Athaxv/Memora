import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ingestSchema = z.object({
  type: z.enum(["text", "url"]),
  content: z.string().min(1).max(100000),
  title: z.string().max(500).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

export const updateNodeSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().max(100000).optional(),
  summary: z.string().max(5000).optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).optional(),
  type: z.string().optional(),
});

export const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(5000),
});
