const MAX_WHATSAPP_LENGTH = 4096;

export async function sendWhatsAppMessage(
  to: string,
  body: string,
  config: { accessToken: string; phoneNumberId: string }
): Promise<void> {
  const truncatedBody =
    body.length > MAX_WHATSAPP_LENGTH
      ? body.slice(0, MAX_WHATSAPP_LENGTH - 15) + "... (truncated)"
      : body;

  try {
    // First try sending as a free-form text message
    let response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: truncatedBody },
        }),
      }
    );

    // If free-form fails, try with the hello_world template to initiate conversation
    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp text send failed, trying template:", response.status, errorText);

      response = await fetch(
        `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
              name: "hello_world",
              language: { code: "en_US" },
            },
          }),
        }
      );
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `WhatsApp send failed (${response.status}) for ${to}: ${error}`
      );
    }
  } catch (error) {
    throw error;
  }
}
