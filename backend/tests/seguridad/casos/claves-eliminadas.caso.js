// Lo ejecuta red.test.js en un proceso aparte, con claves presentes en su entorno.
test('las claves no llegan a las pruebas', () => {
  expect(process.env.RESEND_API_KEY).toBeUndefined();
  expect(process.env.WHATSAPP_TOKEN).toBeUndefined();
  expect(process.env.WHATSAPP_PHONE_NUMBER_ID).toBeUndefined();
});
