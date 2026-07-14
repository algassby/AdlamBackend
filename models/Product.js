
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Product extends Model {}


    Product.init({
         id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty:  true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }}, {
        sequelize,
        modelName: 'Product',
        tableName: 'Products',
        timestamps: true,
        underscored: true
    });

    return Product;
};