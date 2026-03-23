const express = require('express');
const router = express.Router();
const controller = require('./user.controller');
const upload = require('../../utils/upload');

router.get('/', controller.getUsuarios);
router.get('/:id', controller.getUsuarioById);
router.post('/', upload.single('imagen'), controller.createUsuario);
router.put('/:id', upload.single('imagen'), controller.updateUsuario);
router.delete('/:id', controller.deleteUsuario);

module.exports = router;