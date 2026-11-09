const axios = require("axios");

const whatsappActivo = () =>
  process.env.WHATSAPP_ENABLED === "true" &&
  !!process.env.WHATSAPP_TOKEN &&
  !!process.env.WHATSAPP_PHONE_NUMBER_ID;

exports.whatsappActivo = whatsappActivo;

exports.sendTemplateMessage = async (
  telefono,
  templateName,
  parameters = []
) => {
  if (!whatsappActivo()) {
    return null; // WhatsApp apagado: no hace nada y no lanza error
  }

  const response = await axios.post(
    `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: telefono,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "es"
        },
        components: [
          {
            type: "body",
            parameters: parameters.map((value) => ({
              type: "text",
              text: String(value)
            }))
          }
        ]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
};