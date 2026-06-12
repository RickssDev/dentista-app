require('dotenv').config();
const { createApp } = require('./src/config/app');
const { testConnection } = require('./src/config/db');
require("./src/services/reminder.service");

async function start() {
  await testConnection();

  const app = createApp();
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
}

start();