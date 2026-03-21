const JWTFactory = require('../utils/JWTFactory');

exports.verifyToken = (req, res, next) => {
try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
    const error = new Error('Token requerido');
    error.statusCode = 401;
    throw error;
    }

    const token = authHeader.split(' ')[1];

    const decoded = JWTFactory.verifyToken(token);

    req.user = decoded; // id, rol

    next();
} catch (error) {
    error.statusCode = 401;
    next(error);
}
};