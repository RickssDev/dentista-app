const AppError = require('../utils/AppError');

exports.authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(
        new AppError('No tienes permisos para esta acción', 403)
      );
    }

    next();
  };
};