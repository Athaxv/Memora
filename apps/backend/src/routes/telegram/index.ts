import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { telegramLinks, telegramLinkSessions } from "@repo/db/schema";
import { telegramLinkSchema, telegramVerifySchema } from "@repo/validators";
import { ingest } from "@repo/ingestion";
import { classifyIntent } from "@repo/ai/intent";
import { processChat } from "../../services/chat";
import { sendTelegramMessage } from "../../services/telegram";
import { db } from "../../db";
import { config } from "../../config";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateLinkToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function hashLinkToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseStartToken(text: string): string | null {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/i);
  return match?.[1] ?? null;
}

let cachedBotUsername: string | null = null;

async function getTelegramBotUsername(botToken: string): Promise<string | null> {
  if (cachedBotUsername) return cachedBotUsername;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    ok?: boolean;
    result?: { username?: string };
  };

  if (!data.ok || !data.result?.username) return null;

  cachedBotUsername = data.result.username;
  return cachedBotUsername;
}

function getTelegramConfig() {
  return {
    botToken: config.TELEGRAM_BOT_TOKEN,
  };
}

export async function telegramRoutes(app: FastifyInstance) {
  // POST /telegram/link/start — authenticated deep-link init
  app.post(
    "/link/start",
    {
      preHandler: [app.authenticate],
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const { id: userId } = request.user;
      const botToken = config.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return reply.code(500).send({ error: "Telegram is not configured." });
      }

      const botUsername = await getTelegramBotUsername(botToken);
      if (!botUsername) {
        return reply
          .code(500)
          .send({ error: "Could not resolve Telegram bot username." });
      }

      await db.delete(telegramLinkSessions).where(eq(telegramLinkSessions.userId, userId));

      const token = generateLinkToken();
      const tokenHash = hashLinkToken(token);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.insert(telegramLinkSessions).values({
        userId,
        tokenHash,
        expiresAt,
      });

      return reply.send({
        status: "link_started",
        deepLink: `https://t.me/${botUsername}?start=${token}`,
        expiresAt: expiresAt.toISOString(),
      });
    }
  );

  // POST /telegram/webhook — Incoming Telegram updates (public)
  app.post("/webhook", async (request, reply) => {
    const incomingSecret = request.headers["x-telegram-bot-api-secret-token"];
    if (
      config.TELEGRAM_WEBHOOK_SECRET &&
      incomingSecret !== config.TELEGRAM_WEBHOOK_SECRET
    ) {
      return reply.code(403).send({ error: "Invalid webhook secret" });
    }

    // Telegram retries non-2xx responses.
    reply.code(200).send({ ok: true });

    try {
      const update = request.body as {
        message?: {
          text?: string;
          chat?: { id?: number };
        };
      };

      const message = update.message;
      const text = message?.text;
      const chatId = message?.chat?.id;

      if (!text || !chatId) return;

      const chatIdStr = String(chatId);

      const startToken = parseStartToken(text);
      if (startToken) {
        const tokenHash = hashLinkToken(startToken);
        const now = new Date();

        const [session] = await db
          .select()
          .from(telegramLinkSessions)
          .where(
            and(
              eq(telegramLinkSessions.tokenHash, tokenHash),
              isNull(telegramLinkSessions.usedAt),
              gt(telegramLinkSessions.expiresAt, now)
            )
          );

        if (!session) {
          await sendTelegramMessage(
            chatIdStr,
            "This link is invalid or expired. Please start linking again from Settings.",
            getTelegramConfig()
          );
          return;
        }

        const [existingChat] = await db
          .select()
          .from(telegramLinks)
          .where(eq(telegramLinks.chatId, chatIdStr));

        if (existingChat && existingChat.userId !== session.userId) {
          await sendTelegramMessage(
            chatIdStr,
            "This Telegram chat is already linked to another account.",
            getTelegramConfig()
          );
          return;
        }

        const [existingUser] = await db
          .select()
          .from(telegramLinks)
          .where(eq(telegramLinks.userId, session.userId));

        if (existingUser) {
          await db
            .update(telegramLinks)
            .set({
              chatId: chatIdStr,
              verified: true,
              verificationCode: null,
              codeExpiresAt: null,
              updatedAt: now,
            })
            .where(eq(telegramLinks.id, existingUser.id));
        } else {
          await db.insert(telegramLinks).values({
            userId: session.userId,
            chatId: chatIdStr,
            verified: true,
          });
        }

        await db
          .update(telegramLinkSessions)
          .set({ usedAt: now })
          .where(eq(telegramLinkSessions.id, session.id));

        await sendTelegramMessage(
          chatIdStr,
          "Telegram linked successfully. You can now save and query your memories.",
          getTelegramConfig()
        );

        return;
      }

      const [link] = await db
        .select()
        .from(telegramLinks)
        .where(eq(telegramLinks.chatId, chatIdStr));

      if (!link) {
        await sendTelegramMessage(
          chatIdStr,
          "Your Telegram is not linked to Memory OS. Link it from Settings first.",
          getTelegramConfig()
        );
        return;
      }

      if (!link.verified) {
        if (
          link.verificationCode &&
          link.codeExpiresAt &&
          new Date() < link.codeExpiresAt &&
          text.trim() === link.verificationCode
        ) {
          await db
            .update(telegramLinks)
            .set({
              verified: true,
              verificationCode: null,
              codeExpiresAt: null,
              updatedAt: new Date(),
            })
            .where(eq(telegramLinks.id, link.id));

          await sendTelegramMessage(
            chatIdStr,
            "Telegram linked successfully. You can now save and query your memories.",
            getTelegramConfig()
          );
        } else {
          await sendTelegramMessage(
            chatIdStr,
            "Please verify first. Send the 6-digit code from the Settings page.",
            getTelegramConfig()
          );
        }
        return;
      }

      const intent = await classifyIntent(text, config.GROQ_API_KEY);

      if (intent.intent === "store") {
        await ingest(
          {
            db,
            groqApiKey: config.GROQ_API_KEY,
            hfApiKey: config.HF_API_KEY,
          },
          {
            userId: link.userId,
            type: "text",
            content: text,
          }
        );

        await sendTelegramMessage(
          chatIdStr,
          "Saved to your memory graph!",
          getTelegramConfig()
        );
        return;
      }

      const result = await processChat({
        userId: link.userId,
        message: text,
        db,
        groqApiKey: config.GROQ_API_KEY,
        hfApiKey: config.HF_API_KEY,
      });

      await sendTelegramMessage(chatIdStr, result.reply, getTelegramConfig());
    } catch (error) {
      request.log.error(error, "Telegram webhook processing error");
    }
  });

  // GET /telegram/status — authenticated
  app.get("/status", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user;

    const [link] = await db
      .select()
      .from(telegramLinks)
      .where(eq(telegramLinks.userId, userId));

    if (!link) {
      return reply.send({ linked: false });
    }

    return reply.send({
      linked: true,
      chatId: `****${link.chatId.slice(-4)}`,
      verified: link.verified,
    });
  });

  // POST /telegram/link — authenticated
  app.post("/link", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user;
    const { chatId } = telegramLinkSchema.parse(request.body);

    const [existingChat] = await db
      .select()
      .from(telegramLinks)
      .where(eq(telegramLinks.chatId, chatId));

    if (existingChat && existingChat.userId !== userId) {
      return reply
        .code(409)
        .send({ error: "This Telegram chat is linked to another account." });
    }

    const [existingUser] = await db
      .select()
      .from(telegramLinks)
      .where(eq(telegramLinks.userId, userId));

    const code = generateOTP();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser) {
      await db
        .update(telegramLinks)
        .set({
          chatId,
          verified: false,
          verificationCode: code,
          codeExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(telegramLinks.id, existingUser.id));
    } else {
      await db.insert(telegramLinks).values({
        userId,
        chatId,
        verificationCode: code,
        codeExpiresAt,
      });
    }

    await sendTelegramMessage(
      chatId,
      `Your Memory OS verification code is: ${code}\n\nExpires in 10 minutes.`,
      getTelegramConfig()
    );

    return reply.send({ status: "verification_sent" });
  });

  // POST /telegram/verify — authenticated
  app.post("/verify", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user;
    const { code } = telegramVerifySchema.parse(request.body);

    const [link] = await db
      .select()
      .from(telegramLinks)
      .where(eq(telegramLinks.userId, userId));

    if (!link) {
      return reply.code(404).send({ error: "No Telegram link found. Link first." });
    }

    if (link.verified) {
      return reply.send({ status: "already_verified", chatId: `****${link.chatId.slice(-4)}` });
    }

    if (
      !link.verificationCode ||
      !link.codeExpiresAt ||
      new Date() > link.codeExpiresAt
    ) {
      return reply
        .code(400)
        .send({ error: "Verification code expired. Request a new one." });
    }

    if (link.verificationCode !== code) {
      return reply.code(400).send({ error: "Invalid verification code." });
    }

    await db
      .update(telegramLinks)
      .set({
        verified: true,
        verificationCode: null,
        codeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(telegramLinks.id, link.id));

    return reply.send({ status: "verified", chatId: `****${link.chatId.slice(-4)}` });
  });

  // DELETE /telegram/link — authenticated
  app.delete("/link", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user;

    await db.delete(telegramLinks).where(eq(telegramLinks.userId, userId));

    return reply.send({ status: "unlinked" });
  });
}
