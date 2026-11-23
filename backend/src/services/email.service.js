const logger = require('../utils/logger');


const NOMBRE_CLINICA = 'Melissa López N. Odontología Integral';
const COLOR_MARCA = '#d75078';

// ==========================================
// CONFIGURACIÓN
// ==========================================

// Dirección del frontend para generar enlaces.
const urlApp = () => {
  const base = (
    process.env.APP_URL ||
    (process.env.FRONTEND_URL || '').split(',')[0] ||
    (process.env.NODE_ENV !== 'production'
      ? 'http://localhost:8080'
      : '')
  ).trim();

  if (!base) {
    throw new Error('Falta configurar APP_URL');
  }

  if (
    process.env.NODE_ENV === 'production' &&
    !base.startsWith('https://')
  ) {
    throw new Error('APP_URL debe utilizar HTTPS');
  }

  return base.replace(/\/+$/, '');
};

// Evitar insertar HTML desde datos del usuario.
const escaparHtml = (texto = '') =>
  String(texto).replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[caracter]));

// Remitente de los correos.
const remitente = () =>
  `"Melissa López N." <${process.env.EMAIL_REMITENTE || 'onboarding@resend.dev'}>`;

// ==========================================
// PLANTILLA HTML
// ==========================================

const plantilla = ({
  titulo,
  parrafos,
  textoBoton,
  enlace,
  pie
}) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHtml(titulo)}</title>
</head>

<body style="
  margin:0;
  padding:24px;
  background:#fceeee;
  font-family:Arial,Helvetica,sans-serif;
  color:#374151;
">

  <div style="
    max-width:520px;
    margin:0 auto;
    background:#ffffff;
    border-radius:16px;
    padding:32px;
  ">

    <p style="
      margin:0 0 4px;
      font-size:13px;
      font-weight:bold;
      color:${COLOR_MARCA};
    ">
      ${NOMBRE_CLINICA}
    </p>

    <h1 style="
      margin:0 0 16px;
      font-size:22px;
      color:#1f2937;
    ">
      ${escaparHtml(titulo)}
    </h1>

    ${parrafos.map((p) => `
      <p style="
        margin:0 0 16px;
        line-height:1.6;
      ">
        ${p}
      </p>
    `).join('')}

    ${
      enlace
        ? `
          <p style="margin:24px 0;">
            <a
              href="${escaparHtml(enlace)}"
              style="
                display:inline-block;
                background:${COLOR_MARCA};
                color:#ffffff;
                text-decoration:none;
                font-weight:bold;
                padding:12px 24px;
                border-radius:10px;
              "
            >
              ${escaparHtml(textoBoton)}
            </a>
          </p>

          <p style="
            margin:0 0 16px;
            font-size:13px;
            color:#6b7280;
            word-break:break-all;
          ">
            Si el botón no funciona, copia y pega
            este enlace en tu navegador:
            <br>
            ${escaparHtml(enlace)}
          </p>
        `
        : ''
    }

    <p style="
      margin:24px 0 0;
      font-size:13px;
      color:#6b7280;
    ">
      ${escaparHtml(pie)}
    </p>

    <hr style="
      margin:24px 0;
      border:none;
      border-top:1px solid #f3d9e2;
    ">

    <p style="
      margin:0;
      font-size:12px;
      color:#9ca3af;
      text-align:center;
    ">
      Melissa López N. Odontología Integral
      <br>
      Este es un correo automático.
      Por favor, no respondas a este mensaje.
    </p>

  </div>

</body>
</html>
`;

// ==========================================
// ENVÍO DE CORREOS CON RESEND
// ==========================================

// Solo se registra el tipo de correo y el id del proveedor: nunca el destinatario, el asunto ni el
// contenido, que lleva el enlace de recuperación (spec 026, OB2.b; tampoco en desarrollo).
const enviarCorreo = async ({
  tipo,
  para,
  asunto,
  html,
  texto
}) => {

  const apiKey = process.env.RESEND_API_KEY;

  // Sin API Key, permitir pruebas locales sin enviar nada.
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Falta RESEND_API_KEY para enviar correos'
      );
    }

    logger.info('Correo omitido: falta RESEND_API_KEY', { tipo });

    return;
  }

  // Enviar correo mediante API HTTPS.
  const respuesta = await fetch(
    'https://api.resend.com/emails',
    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        from: remitente(),
        to: [para],
        subject: asunto,
        html,
        text: texto
      })
    }
  );

  // Manejar errores de Resend sin arrastrar el cuerpo de su respuesta, que puede citar al
  // destinatario: solo el estado y el nombre del error.
  if (!respuesta.ok) {
    let codigo = null;

    try {
      const cuerpo = JSON.parse(await respuesta.text());
      codigo = typeof cuerpo?.name === 'string' ? cuerpo.name : null;
    } catch {
      codigo = null;
    }

    const error = new Error(`Resend rechazó el correo (${respuesta.status})`);
    error.status = respuesta.status;
    error.codigo = codigo;
    throw error;
  }

  const resultado = await respuesta.json();

  logger.info('Correo enviado', { tipo, id_proveedor: resultado?.id ?? null });

  return resultado;
};

exports.enviarCorreoRestablecer = async ({
  para,
  nombre,
  token,
  minutos
}) => {

  const enlace =
    `${urlApp()}/restablecer-contrasena?token=${encodeURIComponent(token)}`;

  const saludo = nombre
    ? `Hola ${escaparHtml(nombre)},`
    : 'Hola,';

  const saludoTexto = nombre
    ? `Hola ${nombre},`
    : 'Hola,';

  await enviarCorreo({
    tipo: 'recuperacion',

    para,

    asunto: 'Restablece tu contraseña',

    html: plantilla({

      titulo: 'Restablece tu contraseña',

      parrafos: [
        saludo,

        `Recibimos una solicitud para restablecer
        la contraseña de tu cuenta.`,

        `Por seguridad, este enlace es válido
        durante ${minutos} minutos y solamente
        puede utilizarse una vez.`
      ],

      textoBoton: 'Restablecer contraseña',

      enlace,

      pie:
        'Si no solicitaste este cambio, ignora este correo. Tu contraseña permanecerá igual.'
    }),

    texto:
      `${saludoTexto}\n\n` +
      `Recibimos una solicitud para restablecer ` +
      `la contraseña de tu cuenta.\n\n` +
      `El enlace es válido durante ${minutos} minutos ` +
      `y solamente puede utilizarse una vez.\n\n` +
      `${enlace}\n\n` +
      `Si no solicitaste este cambio, ignora este correo.`
  });
};

// ==========================================
// CUENTAS CREADAS CON GOOGLE
// ==========================================

exports.enviarCorreoCuentaGoogle = async ({
  para,
  nombre
}) => {

  const enlace = `${urlApp()}/login`;

  const saludo = nombre
    ? `Hola ${escaparHtml(nombre)},`
    : 'Hola,';

  const saludoTexto = nombre
    ? `Hola ${nombre},`
    : 'Hola,';

  await enviarCorreo({
    tipo: 'cuenta_google',

    para,

    asunto: 'Tu cuenta utiliza Google para iniciar sesión',

    html: plantilla({

      titulo: 'Tu cuenta utiliza Google',

      parrafos: [
        saludo,

        `Recibimos una solicitud para restablecer
        la contraseña de tu cuenta.`,

        `Sin embargo, tu cuenta fue creada
        utilizando Google y no tiene una
        contraseña tradicional.`,

        `Para acceder a tu cuenta, entra a
        nuestro sistema y selecciona
        "Continuar con Google".`
      ],

      textoBoton: 'Ir a iniciar sesión',

      enlace,

      pie:
        'Si no realizaste esta solicitud, puedes ignorar este correo.'
    }),

    texto:
      `${saludoTexto}\n\n` +
      `Recibimos una solicitud para restablecer ` +
      `tu contraseña.\n\n` +
      `Tu cuenta utiliza Google para iniciar sesión.\n\n` +
      `Puedes ingresar desde:\n${enlace}\n\n` +
      `Selecciona "Continuar con Google".\n\n` +
      `Si no realizaste esta solicitud, ignora este correo.`
  });
};

// ==========================================
// AVISO DE CONTRASEÑA ACTUALIZADA
// ==========================================

exports.enviarCorreoContrasenaActualizada = async ({
  para,
  nombre
}) => {
  const saludo = nombre
    ? `Hola ${escaparHtml(nombre)},`
    : 'Hola,';

  const saludoTexto = nombre
    ? `Hola ${nombre},`
    : 'Hola,';

  await enviarCorreo({
    tipo: 'contrasena_actualizada',
    para,

    asunto: 'Aviso de seguridad: contraseña actualizada',

    html: plantilla({
      titulo: 'Contraseña actualizada',

      parrafos: [
        saludo,

        'La contraseña de tu cuenta en Melissa López N. Odontología Integral se ha actualizado correctamente.',

        '<strong>¿No reconoces este cambio?</strong>',

        'Si tú no realizaste este cambio, contacta inmediatamente a la clínica.'
      ],

      pie: 'Este es un aviso de seguridad. No necesitas responder a este correo.'
    }),

    texto:
      `${saludoTexto}\n\n` +
      `La contraseña de tu cuenta en Melissa López N. ` +
      `Odontología Integral se ha actualizado correctamente.\n\n` +
      `Si tú no realizaste este cambio, ` +
      `contacta inmediatamente a la clínica.\n\n` +
      `Este es un aviso de seguridad.`
  });
};