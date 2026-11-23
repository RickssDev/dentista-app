// Entorno ficticio de las pruebas. Ningún valor es una credencial real.
process.env.JWT_SECRET = 'secreto-de-pruebas-no-es-real-0000000000';
process.env.GOOGLE_CLIENT_ID = 'cliente-de-pruebas.example.test';
process.env.WHATSAPP_ENABLED = 'false';

// Spec 026: el logger no escribe durante la suite; las pruebas que lo necesitan usan su captura.
if (!process.env.LOG_LEVEL) process.env.LOG_LEVEL = 'silent';

// Las claves reales que hubiera en el entorno no llegan a las pruebas.
for (const nombre of ['RESEND_API_KEY', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'DB_PASSWORD']) {
  delete process.env[nombre];
}
