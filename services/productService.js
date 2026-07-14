const db = require('../models');
const Product = db.Product;

class ProductService {

    /**
     * 
     * @param {number} id 
     * @returns 
     */
    async getProductById(id){
        const product = await Product.findByPk(id);
        return product;
    }

    async createProduct(productData){
        const product = await Product.create(productData);
        return product;
    }
}

module.exports = new ProductService();