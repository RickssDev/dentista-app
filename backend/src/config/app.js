const express = require("express");
const errorHandler = require('../middlewares/errorHandler');
const indexRoutes = require('../routes');
const cors = require('cors');
const helmet = require('helmet');
const { requestId } = require('../middlewares/requestId');
const registroPeticion = require('../middlewares/registroPeticion');

const obtenerOrigenesPermitidos = () => {
  const origenes = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origen) => origen.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (origenes.length > 0) return origenes;

  if (process.env.NODE_ENV === "production") {
    throw new Error("Falta definir FRONTEND_URL en producción");
  }

  return ["http://localhost:5173"];
};

function createApp() {
  const app = express();
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

  // Primero: identificador y línea por petición, para que toda respuesta los tenga (spec 026).
  app.use(requestId);
  app.use(registroPeticion);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  const origenesPermitidos = obtenerOrigenesPermitidos();

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || origenesPermitidos.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static('uploads'));
  app.get('/', (_req, res) => {
    res.json({
      message: 'API dentista activa.'
    });
  });

  app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok'
  });
  });

  app.use('/api/v1', indexRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};