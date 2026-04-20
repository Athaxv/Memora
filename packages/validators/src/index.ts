import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
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

export const memoryGraphQuerySchema = z.object({
  limit: z.coerce.number().int().min(10).max(100).optional(),
  edgeLimitPerNode: z.coerce.number().int().min(1).max(5).optional(),
  tag: z.string().trim().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const socialLinksSchema = z.object({
  github: z.string().url().max(500).optional().or(z.literal("")),
  linkedin: z.string().url().max(500).optional().or(z.literal("")),
  twitter: z.string().url().max(500).optional().or(z.literal("")),
  portfolio: z.string().url().max(500).optional().or(z.literal("")),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  onboardingCompleted: z.boolean().optional(),
  socialLinks: socialLinksSchema.optional(),
  resumeNodeId: z.string().length(26).optional(),
});

export const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(5000),
});

export const chatSessionsQuerySchema = z.object({
  cursor: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const chatSessionMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const chatSessionParamsSchema = z.object({
  id: z.string().uuid(),
});

export const whatsappLinkSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10,15}$/, "Phone number must be 10-15 digits"),
});

export const whatsappVerifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export const telegramLinkSchema = z.object({
  chatId: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, "Chat ID must be 6-20 digits"),
});

export const telegramVerifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});
