const mongoose = require('mongoose')


const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: 'userId is required',
        refs: "User",
        unique: true
    },
    items: [{
        _id: false,
        productId: {
            type: mongoose.Types.ObjectId,
            required: 'productId is required',
            refs: "Product"
        },
        quantity: {
            type: Number,
            required: "Enter quantity required",
            min: 1
        }
    }],
    totalPrice: {
        type: Number,
        required: 'totalPrice is required',
        Comment: 'Holds total price of all the items in the cart'
    },
    totalItems: {
        type: Number,
        required: 'totalItems are required',
        Comment: 'Holds total number of items in the cart'
    }
}, { timestamps: true })


module.exports = mongoose.model('Cart', cartSchema, 'cart')