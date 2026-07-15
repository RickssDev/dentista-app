const express = require('express');
const router = express.Router();
const controller = require('./servicios.controller');
const upload = require('../../utils/upload');

router.get('/', controller.getServicios);
router.get('/publicos', controller.getServiciosPublicos);
router.get('/:id', controller.getServicioById);

router.post('/', upload.single('imagen'), controller.createServicio);
router.put('/:id', upload.single('imagen'), controller.updateServicio);
router.delete('/:id', controller.deleteServicio);

module.exports = router;