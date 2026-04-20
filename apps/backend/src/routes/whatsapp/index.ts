import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { whatsappLinks } from "@repo/db/schema";
import { whatsappLinkSchema, whatsappVerifySchema } from "@repo/validators";
import { ingest } from "@repo/ingestion";
import { classifyIntent } from "@repo/ai/intent";
import { processChat } from "../../services/chat";
import { sendWhatsAppMessage } from "../../services/whatsapp";
import { db } from "../../db";
import { config } from "../../config";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getWhatsAppConfig() {
  return {
    accessToken: config.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: config.WHATSAPP_PHONE_NUMBER_ID,
  };
}

function verifyWhatsAppSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const received = signatureHeader.slice("sha256=".length);
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(received, "utf8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export async function whatsappRoutes(app: FastifyInstance) {
  // ── Webhook endpoints (NO auth — Meta calls these directly) ──

  // GET /whatsapp/webhook — Meta verification
  app.get(
    "/webhook",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request, reply) => {
    const query = request.query as Record<string, string>;
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (mode === "subscribe" && token === config.WHATSAPP_VERIFY_TOKEN) {
      return reply.code(200).send(challenge);
    }

      return reply.code(403).send({ error: "Verification failed" });
    }
  );

  // POST /whatsapp/webhook — Incoming messages
  app.post("/webhook", {
    config: { rawBody: true, rateLimit: { max: 120, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const rawBody = request.rawBody;
    const signature = request.headers["x-hub-signature-256"];

    if (!config.WHATSAPP_APP_SECRET) {
      request.log.error("WHATSAPP_APP_SECRET is not configured");
      return reply.code(503).send({ error: "WhatsApp webhook is not configured" });
    }

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      request.log.warn("Missing raw body for WhatsApp webhook verification");
      return reply.code(400).send({ error: "Invalid webhook payload" });
    }

    const signatureValue =
      typeof signature === "string" ? signature : Array.isArray(signature) ? signature[0] : undefined;

    if (!verifyWhatsAppSignature(rawBody, signatureValue, config.WHATSAPP_APP_SECRET)) {
      return reply.code(403).send({ error: "Invalid webhook signature" });
    }

    // Always respond 200 immediately — Meta retries on non-2xx
    reply.code(200).send("EVENT_RECEIVED");

    try {
      const body = request.body as any;
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) return;

      for (const msg of messages) {
        const from = msg.from as string;

        // Only support text messages for now
        if (msg.type !== "text") {
          await sendWhatsAppMessage(
            from,
            "I currently only support text messages. Send me a text to save or query your memories!",
            getWhatsAppConfig()
          );
          continue;
        }

        const messageText = msg.text.body as string;

        // Look up user by phone number
        const [link] = await db
          .select()
          .from(whatsappLinks)
          .where(eq(whatsappLinks.phoneNumber, from));

        if (!link) {
          await sendWhatsAppMessage(
            from,
            "Your number isn't linked to Memory OS. Visit the app to connect your WhatsApp.",
            getWhatsAppConfig()
          );
          continue;
        }

        // Handle unverified users — check if message is the OTP
        if (!link.verified) {
          if (
            link.verificationCode &&
            link.codeExpiresAt &&
            new Date() < link.codeExpiresAt &&
            messageText.trim() === link.verificationCode
          ) {
            await db
              .update(whatsappLinks)
              .set({
                verified: true,
                verificationCode: null,
                codeExpiresAt: null,
                updatedAt: new Date(),
              })
              .where(eq(whatsappLinks.id, link.id));

            await sendWhatsAppMessage(
              from,
              "Your WhatsApp is now linked to Memory OS! Send me anything to save or ask about your memories.",
              getWhatsAppConfig()
            );
          } else {
            await sendWhatsAppMessage(
              from,
              "Please verify your number first. Check the Memory OS app for your verification code.",
              getWhatsAppConfig()
            );
          }
          continue;
        }

        // Verified user — process the message
        const intent = await classifyIntent(messageText, config.GROQ_API_KEY);

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
              content: messageText,
            }
          );
          await sendWhatsAppMessage(
            from,
            "Saved to your memory graph!",
            getWhatsAppConfig()
          );
        } else {
          const result = await processChat({
            userId: link.userId,
            message: messageText,
            db,
            groqApiKey: config.GROQ_API_KEY,
            hfApiKey: config.HF_API_KEY,
          });
          await sendWhatsAppMessage(from, result.reply, getWhatsAppConfig());
        }
      }
    } catch (error) {
      request.log.error(error, "WhatsApp webhook processing error");
    }
  });

  // ── User-facing endpoints (JWT auth required) ──

  // GET /whatsapp/status — Check link status
  app.get("/status", {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { id: userId } = request.user;

    const [link] = await db
      .select()
      .from(whatsappLinks)
      .where(eq(whatsappLinks.userId, userId));

    if (!link) {
      return reply.send({ linked: false });
    }

    const maskedPhone = "****" + link.phoneNumber.slice(-4);
    return reply.send({
      linked: true,
      phoneNumber: maskedPhone,
      verified: link.verified,
    });
  });

  // POST /whatsapp/link — Start linking
  app.post("/link", {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { id: userId } = request.user;
    const { phoneNumber } = whatsappLinkSchema.parse(request.body);

    // Check if phone already linked to another user
    const [existingPhone] = await db
      .select()
      .from(whatsappLinks)
      .where(eq(whatsappLinks.phoneNumber, phoneNumber));

    if (existingPhone && existingPhone.userId !== userId) {
      return reply.code(409).send({
        error: "This phone number is already linked to another account.",
      });
    }

    // Check if user already has a link (possibly with a different number)
    const [existingUser] = await db
      .select()
      .from(whatsappLinks)
      .where(eq(whatsappLinks.userId, userId));

    const code = generateOTP();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      // Update existing link with new phone/code
      await db
        .update(whatsappLinks)
        .set({
          phoneNumber,
          verified: false,
          verificationCode: code,
          codeExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(whatsappLinks.id, existingUser.id));
    } else {
      // New link
      await db.insert(whatsappLinks).values({
        userId,
        phoneNumber,
        verificationCode: code,
        codeExpiresAt,
      });
    }

    // Send OTP via WhatsApp
    await sendWhatsAppMessage(
      phoneNumber,
      `Your Memory OS verification code is: ${code}\n\nExpires in 10 minutes.`,
      getWhatsAppConfig()
    );

    return reply.send({ status: "verification_sent" });
  });

  // POST /whatsapp/verify — Confirm OTP
  app.post("/verify", {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { id: userId } = request.user;
    const { code } = whatsappVerifySchema.parse(request.body);

    const [link] = await db
      .select()
      .from(whatsappLinks)
      .where(eq(whatsappLinks.userId, userId));

    if (!link) {
      return reply.code(404).send({ error: "No WhatsApp link found. Link your number first." });
    }

    if (link.verified) {
      return reply.send({ status: "already_verified", phoneNumber: "****" + link.phoneNumber.slice(-4) });
    }

    if (
      !link.verificationCode ||
      !link.codeExpiresAt ||
      new Date() > link.codeExpiresAt
    ) {
      return reply.code(400).send({ error: "Verification code expired. Please request a new one." });
    }

    if (link.verificationCode !== code) {
      return reply.code(400).send({ error: "Invalid verification code." });
    }

    await db
      .update(whatsappLinks)
      .set({
        verified: true,
        verificationCode: null,
        codeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(whatsappLinks.id, link.id));

    return reply.send({
      status: "verified",
      phoneNumber: "****" + link.phoneNumber.slice(-4),
    });
  });

  // DELETE /whatsapp/link — Unlink
  app.delete("/link", {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { id: userId } = request.user;

    await db
      .delete(whatsappLinks)
      .where(eq(whatsappLinks.userId, userId));

    return reply.send({ status: "unlinked" });
  });
}
