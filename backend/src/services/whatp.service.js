const axios = require("axios");

const whatsappActivo = () =>
  process.env.WHATSAPP_ENABLED === "true" &&
  !!process.env.WHATSAPP_TOKEN &&
  !!process.env.WHATSAPP_PHONE_NUMBER_ID;

exports.whatsappActivo = whatsappActivo;

// La API de WhatsApp exige el número en formato internacional, sin «+». Los teléfonos de los
// pacientes se guardan con 10 dígitos de México: se les antepone 52. Un número que ya trae su código
// se deja igual (ficha 2026-11-24-fix-whatsapp-codigo-pais)
const formatoInternacional = (telefono) => {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  return digitos.length === 10 ? `52${digitos}` : digitos;
};

exports.formatoInternacional = formatoInternacional;

exports.sendTemplateMessage = async (
  telefono,
  templateName,
  parameters = []
) => {
  if (!whatsappActivo()) {
    return null; // WhatsApp apagado: no hace nada y no lanza error
  }

  // Un teléfono sin dígitos («N/A», «---») no se manda a Meta: el aviso falla sin mostrar el valor
  const destino = formatoInternacional(telefono);
  if (!destino) {
    throw new Error("El teléfono no tiene dígitos");
  }

  const response = await axios.post(
    `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: destino,
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