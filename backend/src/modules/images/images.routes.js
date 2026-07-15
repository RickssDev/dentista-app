const express = require('express');
const router = express.Router();
const controller = require('./images.controller');
const upload = require('../../utils/upload');
    
router.get('/', controller.getImagen);
router.get('/publicas', controller.getImagenesPublicas);
router.get('/:id', controller.getImagenById);

router.post('/', upload.single('imagen'), controller.createImagen);
router.put('/:id', upload.single('imagen'), controller.updateImagen);
router.delete('/:id', controller.deleteImagen);

module.exports = router;