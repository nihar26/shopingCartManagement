const express = require('express');

const router = express.Router();

const fs = require("fs");

const { userAuth } = require('../middleware')

const { userController, productController, cartController, orderController } = require('../controllers')


// user routes
router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.get('/user/:userId/profile', userAuth, userController.getUserProfile)

router.put('/user/:userId/profile', userAuth, userController.updateUser)

// product routes
router.post('/products', productController.registerProduct);
router.get('/products', productController.listProducts)

router.get('/products/:productId', productController.getProductById)

router.put('/products/:productId', productController.updateProduct)

router.delete('/products/:productId', productController.deleteProductByID)

// CART routes 
router.post('/users/:userId/cart', userAuth, cartController.createCart);

router.put('/users/:userId/cart', userAuth, cartController.removeProduct);

router.get('/users/:userId/cart', userAuth, cartController.getCart);

router.delete('/users/:userId/cart', userAuth, cartController.deleteCart)


// Order Routes
router.post('/users/:userId/order', userAuth, orderController.createOrder);

router.put('/users/:userId/order', userAuth, orderController. updateOrderStatus);

module.exports = router; 