const MAX_TELEGRAM_LENGTH = 4096;

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  config: { botToken: string }
): Promise<void> {
  if (!config.botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not configured");
    return;
  }

  const body =
    text.length > MAX_TELEGRAM_LENGTH
      ? `${text.slice(0, MAX_TELEGRAM_LENGTH - 15)}... (truncated)`
      : text;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Telegram send failed:", response.status, error);
    }
  } catch (error) {
    console.error("Telegram send error:", error);
  }
}
