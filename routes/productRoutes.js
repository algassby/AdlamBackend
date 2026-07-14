const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')


router.get('/:id', productController.getById);
router.post('/', productController.create);

module.exports = router;