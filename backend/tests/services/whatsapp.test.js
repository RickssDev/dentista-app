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

// Ficha 2026-11-24-fix-whatsapp-codigo-pais: la API exige el formato internacional (52 + 10 dígitos
// para México); los teléfonos se guardan con 10 dígitos
describe('007 CA1, CA3 · el teléfono se envía en formato internacional', () => {
  const destinoDe = async (telefono) => {
    encender();
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'm' }] } });
    await sendTemplateMessage(telefono, 'cita_recordatorio', ['Ana']);
    return axios.post.mock.calls[0][1].to;
  };

  test.each([
    ['10 dígitos', '5500000000', '525500000000'],
    ['10 dígitos con espacios y guiones', '55 0000-0000', '525500000000'],
    ['con +52', '+52 55 0000 0000', '525500000000'],
    ['ya con 52', '525500000000', '525500000000'],
    ['con 521 (formato antiguo de móvil)', '5215500000000', '5215500000000'],
    ['con paréntesis', '(55) 0000 0000', '525500000000'],
  ])('%s: %s → %s', async (_caso, telefono, esperado) => {
    expect(await destinoDe(telefono)).toBe(esperado);
  });
});

test('007 · un teléfono sin dígitos no se envía a WhatsApp y el envío falla sin mostrarlo', async () => {
  encender();
  await expect(sendTemplateMessage('N/A', 'cita_recordatorio', ['Ana'])).rejects.toThrow('El teléfono no tiene dígitos');
  expect(axios.post).not.toHaveBeenCalled();
});
