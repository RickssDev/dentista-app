jest.mock('axios', () => ({ post: jest.fn() }));

const axios = require('axios');
const { sendTemplateMessage } = require('../../src/services/whatp.service');

const encender = () => {
  process.env.WHATSAPP_ENABLED = 'true';
  process.env.WHATSAPP_TOKEN = 'clave-ficticia';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'id-ficticio';
};

afterEach(() => {
  process.env.WHATSAPP_ENABLED = 'false';
  delete process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  axios.post.mockReset();
});

test('007 CA1 · con WhatsApp encendido envía la plantilla', async () => {
  encender();
  axios.post.mockResolvedValue({ data: { messages: [{ id: 'mensaje-de-prueba' }] } });

  const resultado = await sendTemplateMessage('5500000000', 'cita_recordatorio', ['Ana']);

  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][0]).toContain('/id-ficticio/messages');
  expect(axios.post.mock.calls[0][1].template.name).toBe('cita_recordatorio');
  expect(resultado).toEqual({ messages: [{ id: 'mensaje-de-prueba' }] });
});

test('007 CA5 · con WhatsApp apagado no envía nada y no lanza error', async () => {
  await expect(sendTemplateMessage('5500000000', 'cita_recordatorio', [])).resolves.toBeNull();
  expect(axios.post).not.toHaveBeenCalled();
});
