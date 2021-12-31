const mongoose = require('mongoose')

const express = require("express")

const { validator } = require('../utils')

const { systemConfig } = require('../configs')

const { userModel, productModel, cartModel } = require('../models')
const { update } = require('../models/userModel')


const createCart = async function (req, res) {
    try {
        const requestBody = req.body;

        const userId = req.params.userId;

        const userIdFromToken = req.UserId


        if (!validator.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide details' })
            return
        }

        if (!validator.isValid(userId)) {
            res.status(400).send({ status: false, message: 'userId is required' })
            return
        }

        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is invalid` })
        }

        if (!validator.isValidObjectId(userIdFromToken)) {
            res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid token id` })
            return
        }

        if (!(userId === userIdFromToken)) {
            res.status(403).send({ status: false, message: `Not Authorised` })
            return
        }

        const { productId, quantity, cartId } = requestBody;

        let user = await userModel.findOne({ _id: userId })

        if (!user) {
            res.status(404).send({ status: false, message: 'user not found' })
            return
        }

        if (!validator.isValid(productId)) {
            res.status(400).send({ status: false, message: 'productId is required' })
            return
        }

        if (!validator.isValidObjectId(productId)) {
            res.status(400).send({ status: false, message: `${productId} is invalid` })
        }

        let product = await productModel.findOne({ _id: productId, isDeleted: false, deletedAt: null })

        if (!validator.isValid(product)) {
            res.status(404).send({ status: false, message: 'product not found' })
            return
        }

        if (!validator.isValid(quantity)) {
            res.status(400).send({ status: false, message: 'quantity is required' })
            return
        }

        if (!validator.isValidNumber(quantity)) {
            res.status(400).send({ status: false, message: 'Please enter a number' })
            return
        }

        if (!validator.quantityRange(quantity)) {
            res.status(400).send({ status: false, message: 'Quantity should be greater than equal to 1 ' })
            return
        }

        if (validator.isValid(cartId)) {

            if (!validator.isValidObjectId(cartId)) {
                res.status(400).send({ Status: false, msg: `${cartId} is not a valid cartId` })
                return
            }

            let cart = await cartModel.findOne({ _id: cartId })

            if (!validator.isValid(cart)) {
                res.status(400).send({ Status: false, msg: 'Cart doesnt exist' })
            }

            let items = [{ productId, quantity }]

            let updated = { $addToSet: { items: items } }

            updated['$inc'] = {}

            updated['$inc']['totalPrice'] = product.price * quantity

            updated['$inc']['totalItems'] = 1

            let cartData = await cartModel.findOneAndUpdate({ userId }, updated, { new: true })

            res.status(200).send({ status: false, message: 'cart already exists ,items added to cart', data: cartData })
            return

        }

        if (!validator.isValid(cartId)) {

            let cart = await cartModel.findOne({ userId })

            let items = [{ productId, quantity }]

            if (cart) {
                let updated = { $addToSet: { items: items } }

                updated['$inc'] = {}

                updated['$inc']['totalPrice'] = product.price * quantity

                updated['$inc']['totalItems'] = 1

                let cartData = await cartModel.findOneAndUpdate({ userId }, updated, { new: true })

                res.status(200).send({ status: false, message: 'cart already exists ,items added to cart', data: cartData })
                return
            }

        }

        const cartData = {
            userId, items: [{ productId, quantity }], totalPrice: product.price * quantity, totalItems: 1
        }

        const newCart = await cartModel.create(cartData)

        res.status(201).send({ status: true, message: 'Cart added successfully', data: newCart })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message });
    }
}

const removeProduct = async function (req, res) {
    try {
        const requestBody = req.body

        const userId = req.params.userId

        const userIdFromToken = req.UserId

        if (!validator.isValidObjectId(userIdFromToken)) {
            res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid token id` })
            return
        }

        if (!(userId === userIdFromToken)) {
            res.status(403).send({ status: false, message: `Not Authorised` })
            return
        }

        if (!validator.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request , cart unmodified ' })
            return
        }

        let { productId, cartId, removeProduct } = requestBody

        // Validation stats
        if (!validator.isValid(productId)) {
            res.status(400).send({ status: false, message: `ProductId is required` })
            return
        }

        if (!validator.isValid(removeProduct)) {
            res.status(400).send({ status: false, message: `RemoveProduct is required` })
            return
        }

        if (!validator.isValid(cartId)) {
            res.status(400).send({ status: false, message: ` cartId is required` })
            return
        }

        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        let product = await productModel.findOne({ _id: productId, isDeleted: false, deletedAt: null })

        if (!product) {
            res.status(404).send({ Status: false, msg: "product doesn't exist" })
            return
        };

        let cart = await cartModel.findOne({ _id: cartId })

        if (!cart) {
            res.status(404).send({ Status: false, msg: "cart doesn't exist" })
            return
        };

        if (!validator.isValidNumber(removeProduct)) {
            res.status(400).send({ Status: fasle, msg: "removeProduct should be a Number" })
            return
        }

        if (!(removeProduct === 1 || removeProduct === 0)) {
            res.status(400).send({ Status: fasle, msg: "removeProduct should be either 0 or 1" })
            return
        }

        let items = cart.items

        let updatePrice = 0

        if (removeProduct === 1) {

            if (cart) {
                for (let i = 0; i < items.length; i++) {
                    if (productId == items[i].productId) {
                        updatePrice = items[i].quantity * product.price
                        items.splice(items[i], 1)
                    }
                }
            }
        }

        if (removeProduct === 0) {

            if (cart) {
                for (let i = 0; i < items.length; i++) {
                    if (productId == items[i].productId) {
                        if(items[i].quantity > 0){
                        items[i].quantity = items[i].quantity - 1
                        updatePrice = product.price
                        }
                    }
                }
            }
        }

        let update = { $set: { items: items } };

        update['$inc'] = {}

        update['$inc']['totalPrice'] = -updatePrice;

        if(removeProduct === 1) {
            update['$inc']['totalItems'] = -1
        }

        const updatedcart = await cartModel.findOneAndUpdate({ _id: cartId }, update, { new: true })

        res.status(200).send({ status: true, message: 'cart Details Updated', data: updatedcart });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const getCart = async function (req, res) {
    try {
        const userId = req.params.userId

        const userIdFromToken = req.UserId

        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        if (!validator.isValidObjectId(userIdFromToken)) {
            res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid token id` })
            return
        }

        if (!(userId === userIdFromToken)) {
            res.status(403).send({ status: false, message: `Not Authorised` })
            return
        }

        const user = await userModel.findOne({ _id: userId })

        if (!user) {
            res.status(404).send({ status: false, message: "User not found" })

        }


        const cart = await cartModel.find({ userId: userId })
        res.status(200).send({ status: true, message: "cart Details", data: cart })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const deleteCart = async function (req, res) {
    try {
        const cartId = req.body.cartId

        const userId = req.params.userId

        const userIdFromToken = req.UserId

        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        if (!validator.isValidObjectId(userIdFromToken)) {
            res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid token id` })
            return
        }

        if (!(userId === userIdFromToken)) {
            res.status(403).send({ status: false, message: `Not Authorised` })
            return
        }

        const user = await userModel.findOne({ _id: userId })

        if (!user) {
            res.status(404).send({ status: false, message: "User not found" })
            return

        }

        if (validator.isValid(cartId)) {
            if (!validator.isValidObjectId(cartId)) {
                res.status(400).send({ status: false, message: `${cartId} is not a valid cart id` })
                return

            }
        }

        if(!validator.isValid(cartId)){
            let update = {}

            update['$set'] = {}

            update['$set']['items'] = [];

            update['$set']['totalPrice'] = 0;

            update['$set']['totalItems'] = 0;

            update['$set']['totalQuantity'] = 0;

            const cart = await cartModel.findOneAndUpdate({ userId }, update, {new:true})

            if (!cart) {
                res.status(404).send({ status: false, message: `Cart not found` })
                return

            }

        }

        if (validator.isValid(cartId)) {

            let update = {}

            update['$set'] = {}

            update['$set']['items'] = [];

            update['$set']['totalPrice'] = 0;

            update['$set']['totalItems'] = 0;

            update['$set']['totalQuantity'] = 0;

            let cartData = await cartModel.findOneAndUpdate({ _id: cartId }, update, {new:true})

            if (!cartData) {
                res.status(404).send({ status: false, message: `Cart not found` })
                return

            }
        }

        res.status(200).send({ status: true, message: `Cart deleted successfully` })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = {
    createCart,
    removeProduct,
    getCart,
    deleteCart
}