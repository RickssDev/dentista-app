const express = require("express");
const errorHandler = require('../middlewares/errorHandler');
const indexRoutes = require('../routes');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.get('/', (_req, res) => {
    res.json({
      message: 'API dentista activa.'
    });
  });
  
  app.use('/api/v1', indexRoutes);
  
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};


