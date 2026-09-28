const JWTFactory = require('../utils/JWTFactory');

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      const error = new Error('Token requerido');
      error.statusCode = 401;
      error.name = 'MissingAuthorizationError';
      throw error;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      const error = new Error('Token requerido');
      error.statusCode = 401;
      error.name = 'MissingAuthorizationError';
      throw error;
    }

    const decoded = JWTFactory.verifyToken(token);

    if (!decoded || !decoded.id || !decoded.rol) {
      const error = new Error('Token invalido: falta la identidad o el rol del usuario.');
      error.statusCode = 401;
      error.name = 'MissingUserIdentityError';
      throw error;
    }

    req.user = {
      id: decoded.id,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    next(error);
  }
};