import type { ExtractedContent } from "../types";
import OpenAI from "openai";

export async function extractFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  groqApiKey: string
): Promise<ExtractedContent> {
  if (mimeType === "application/pdf") {
    return extractPdf(buffer, fileName);
  }

  if (mimeType.startsWith("image/")) {
    return extractImage(buffer, mimeType, fileName, groqApiKey);
  }

  // Plain text files (.txt, .md, .csv, etc.)
  const content = buffer.toString("utf-8");
  const title = fileName.replace(/\.[^.]+$/, "") || "Untitled";
  return { title, content: content.slice(0, 50000) };
}

async function extractPdf(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedContent> {
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = pdfParseModule.default ?? pdfParseModule;
  const data = await pdfParse(buffer);

  const title =
    data.info?.Title || fileName.replace(/\.pdf$/i, "") || "Untitled PDF";
  const content = (data.text as string).slice(0, 50000);

  return { title, content };
}

async function extractImage(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  groqApiKey: string
): Promise<ExtractedContent> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const client = new OpenAI({
    apiKey: groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this image in detail. Include any text, diagrams, charts, or visual elements you can identify. Be thorough but concise.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  });

  const description =
    response.choices[0]?.message?.content ?? "No description available.";
  const title = fileName.replace(/\.[^.]+$/, "") || "Untitled Image";

  return { title, content: description };
}
