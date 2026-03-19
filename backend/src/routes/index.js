const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const citasRoutes = require('../modules/citas/citas.routes');
const comenRoutes = require('../modules/comentarios/comen.routes');
const faqsRoutes = require('../modules/faqs/faqs.routes');
const historialRoutes = require('../modules/historial/historial.routes');   
const imagenesRoutes = require('../modules/images/images.routes');  
const pacientesRoutes = require('../modules/pacientes/pacientes.routes');
const promocionesRoutes = require('../modules/promocion/promo.routes');
const reportesRoutes = require('../modules/reportes/reportes.routes');
const serviciosRoutes = require('../modules/servicios/servicios.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/usuarios', userRoutes);
router.use('/citas', citasRoutes);
router.use('/comentarios', comenRoutes);
router.use('/faqs', faqsRoutes);
router.use('/historial', historialRoutes);
router.use('/imagenes', imagenesRoutes);
router.use('/pacientes', pacientesRoutes);
router.use('/promociones', promocionesRoutes);
router.use('/reportes', reportesRoutes);
router.use('/servicios', serviciosRoutes);

module.exports = router;
