require('dotenv').config();
const { createApp } = require('./src/config/app');
const { testConnection } = require('./src/config/db');

async function start() {
  await testConnection();

  const app = createApp();
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
}

start();