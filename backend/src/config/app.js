const express = require("express");
const errorHandler = require('../middlewares/errorHandler');
const indexRoutes = require('../routes');
const cors = require('cors');

function createApp() {
  const app = express();

const allowedOrigins = [
  "http://localhost:5174",
  "http://192.168.11.239:5174" 
];

app.use(cors({
  origin: function(origin, callback){
    return callback(null, true);
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
  
  app.use('/api/v1', indexRoutes);
  
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};


