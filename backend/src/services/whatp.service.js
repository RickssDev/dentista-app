const axios = require("axios");

exports.sendTemplateMessage = async (
  telefono,
  templateName,
  parameters = []
) => {
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