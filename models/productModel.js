const mongoose = require('mongoose')

const {validator} = require('../utils')

const productSchema = new mongoose.Schema({
    title: {
        type: String, 
        required: "title is required", 
        unique: true
    },
  description: {
      type: String, 
      required: "description is required",
    },
  price: {
      type: Number, 
      required: "price is required", 
      validate: {validator: validator.isValidNumber, message: 'Price should be valid Number', isAsync: false}
    },
  currencyId: {
      type: String,
      required: "currencyId is required", 
      default: 'INR'
    },
  currencyFormat: {
      type: String, 
      required: "currencyFormat is required", 
      default: '₹'
    },
  isFreeShipping: {
      type: Boolean, 
      default: false
    },
  productImage: {
      type: String,
      required: "productImage is required", 
    },
  style: {
      type: String
    },
  availableSizes: {
      type: [String], 
      required: "availableSizes is required", 
      enum: ["S", "XS","M","X", "L","XXL", "XL"]
    },
  installments: {
      type: Number
    },
  deletedAt: {
      type: Date,
    }, 
  isDeleted: {
      type: Boolean, 
      default: false
    },
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema, 'product')