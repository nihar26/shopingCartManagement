const mongoose = require('mongoose')

const { validator } = require('../utils')

const { systemConfig } = require('../configs')

const { userModel, productModel, orderModel, cartModel } = require('../models')

const createOrder = async function (req, res) {

    try {

        const requestBody = req.body;

        const userId = req.params.userId;

        const userIdFromToken = req.UserId

        if (!validator.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide details' })
            return
        }

        const { status, cancellable, cartId } = requestBody;

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

        let user = await userModel.findOne({ _id: userId })

        if (!user) {
            res.status(404).send({ status: false, message: 'user not found' })
            return
        }

        if (!validator.isValid(cartId)) {
            res.status(400).send({ status: false, message: 'CartId is required' })
            return
        }

        if (!validator.isValidObjectId(cartId)) {
            res.status(400).send({ status: false, message: `${cartId} is invalid` })
        }

        let cart = await cartModel.findOne({ _id: cartId })

        if (!cart) {
            res.status(404).send({ status: false, message: 'cart not found' })
            return
        }

        if (validator.isValid(status)) {
            if (!validator.isValidString(status)) {
                res.status(400).send({ status: false, message: 'Status should be a string' })
                return
            }

            if (!validator.isValidStatus(status)) {
                res.status(400).send({ status: false, message: `Status should be among ${systemConfig.statusEnumArray.join(', ')}` })
                return
            }

        }

        if(validator.isValid(cancellable)){
            if(!validator.isValidBoolean(cancellable)){
                res.status(400).send({ status: false, message: 'Cancelleble should be a Boolean' })
                return
            }
        }

        if (!validator.isValidArray(cart.items)) {
            res.status(400).send({ status: false, message: `Can't Place a order without items in cart` })
            return
        }

        let quantity = 0;

        let items = cart.items

        for (i = 0; i < items.length; i++) {
            quantity = quantity + items[i].quantity
        }

        const orderData = {
            cancellable, userId, items: cart.items, totalPrice: cart.totalPrice, totalItems: cart.totalItems, totalQuantity: quantity,  status
        }

        const newOrder = await orderModel.create(orderData)

        res.status(201).send({ status: true, message: 'Order added successfully', data: newOrder })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message });
    }
}


const updateOrderStatus = async function (req, res) {
    try {
        const requestBody = req.body

        const userId = req.params.userId

        const userIdFromToken = req.UserId

        // Validation stats
        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }
        let { orderId, status } = requestBody


        if (!validator.isValid(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request , User unmodified ' })
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

        if (!validator.isValid(orderId)) {
            res.status(400).send({ status: false, message: 'orderId is required' })
            return
        }

        if (!validator.isValidObjectId(orderId)) {
            res.status(400).send({ status: false, message: `${orderId} is invalid` })
        }

        if (!validator.isValidString(status)) {
            res.status(400).send({ status: false, message: 'Please enter a string' })
            return
        }

        if (!validator.isValidStatus(status)) {
            res.status(400).send({ status: false, message: `Status should be among ${systemConfig.statusEnumArray.join(', ')}` })
            return
        }

        let user = await userModel.findOne({ _id: userId })

        if (!user) {
            res.status(404).send({ Status: false, msg: "User doesn't exist" })
            return
        };

        let order = await orderModel.findOne({ _id: orderId })

        if (!order) {
            res.status(404).send({ Status: false, msg: "order unmodified" })
            return
        };

        if (!(order.userId == userId)) {

            res.status(400).send({ Status: false, msg: "order doesn't exist" })
            return
        }

        if (order.cancellable === false) {
            res.status(404).send({ Status: false, msg: "order is not cancellable" })
            return
        }

        const updatedOrderStatus = {}

        if (validator.isValid(status)) {
            if (!Object.prototype.hasOwnProperty.call(updatedOrderStatus, '$set')) updatedOrderStatus['$set'] = {}
            updatedOrderStatus['$set']['status'] = status
        }


        const updatedOrder = await orderModel.findOneAndUpdate({ _id: orderId }, updatedOrderStatus, { new: true })

        res.status(200).send({ status: true, message: 'order Updated', data: updatedOrder });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = {
    createOrder,
    updateOrderStatus
}