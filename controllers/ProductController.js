const productService = require("../services/productService");

class ProductController {
    async getById(req, res) {

        try {
            const { id } = req.params.id;
            const product = await productService.getProductById(id);
            if(!product) {
                return res.status(404).json({message : `Produit avec l'id ${id} introuvable.`})
            }
            
            return res.status(200).json(product);

        }

        catch(error) {
            return res.status(500).json({error: error.message})

        }
    }

    async create(req, res) {
    try {
      // req.body contient le JSON parsé envoyé par le client (@RequestBody)
      const newProduct = await productService.createProduct(req.body);
      
      // ResponseEntity.status(HttpStatus.CREATED).body(newProduct)
      return res.status(201).json(newProduct);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();