const multer = require('multer')

const { validator, aws, jwt } = require('../utils')

const { systemConfig } = require('../configs')

const { productModel } = require('../models');


const registerProduct = async function (req, res) {
    try {
        const requestBody = req.body.json;

        const files = req.files

        if (!validator.isValid(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request , Body is required' })
            return
        }

        if (!validator.isValidRequestBody(JSON.parse(requestBody))) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide User details' })
            return
        };

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = JSON.parse(requestBody.trim());

        // Validation Starts

        if (!validator.isValid(title)) {
            res.status(400).send({ status: false, message: 'Title is Required' })
            return
        };

        if (!validator.isValid(description)) {
            res.status(400).send({ status: false, message: 'Description is Required' })
            return
        };

        if (!validator.isValid(price)) {
            res.status(400).send({ status: false, message: 'Price is Required' })
            return
        };

        if (!validator.isValid(availableSizes)) {
            res.status(400).send({ status: false, message: 'availableSizes is Required' })
            return
        };

        if (!validator.isValidArray(availableSizes)) {
            res.status(400).send({ status: false, message: 'Should have atleast one size available' })
            return
        };

        if (!validator.isValid(files[0])) {
            res.status(400).send({ status: false, message: 'Product Image is required' })
            return
        }

        // validation Ends

        // Parameter type Check

        if (!validator.isValidString(title)) {
            res.status(400).send({ status: false, message: 'title Should be a string' })
            return
        };

        if (!validator.isValidString(description)) {
            res.status(400).send({ status: false, message: 'description Should be a string' })
            return
        };

        if (!validator.isValidNumber(price)) {
            res.status(400).send({ status: false, message: 'price Should be a number' })
            return
        };

        if (!validator.isValidString(currencyId)) {
            res.status(400).send({ status: false, message: 'currencyId Should be a String' })
            return
        };

        let isTitleAlreadyInUse = await productModel.findOne({ title })

        if (isTitleAlreadyInUse) {
            res.status(400).send({ Status: false, msg: `${title} Already exists` })
            return
        };

        if (!validator.isValidString(currencyFormat)) {
            res.status(400).send({ status: false, message: 'currencyFormat Should be a string' })
            return
        };

        if (!validator.isValidBoolean(isFreeShipping)) {
            res.status(400).send({ status: false, message: 'isFreeShipping Should be a boolean' })
            return
        };

        if(validator.isValid(style)){
        if (!validator.isValidString(style)) {
            res.status(400).send({ status: false, message: 'style Should be a string' })
            return
        };
        };

        if (!validator.isArray(availableSizes)) {
            res.status(400).send({ status: false, message: 'AvailableSizes Should be a array' })
            return
        };

        if (!validator.isValidSize(availableSizes)) {
            res.status(400).send({ status: false, message: `AvailableSizes Should be among ${systemConfig.sizeEnumArray.join(', ')}` })
            return
        };

        if (validator.isValid(installments)) {
            if (!validator.isValidNumber(installments)) {
                res.status(400).send({ status: false, message: 'installments Should be a number' })
                return
            };
        };

        // Validation Ends

        let productImage = await aws.uploadFile(files[0]);

        const productData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            productImage,
            style,
            availableSizes,
            installments
        };

        const newProduct = await productModel.create(productData)
        res.status(201).send({ status: true, message: 'Product added successfully', data: newProduct })
    } catch (err) {
        console.log(err)
        res.status(500).send({ Status: false, Msg: err.message })
    }
}


const listProducts = async function (req, res) {
    try {

        const filterQuery = { isDeleted: false, deletedAt: null }

        const queryParams = req.query

        let sort = {}

        if (validator.isValidRequestBody(queryParams)) {
            let { sortOrder, productId, title, availableSizes, priceGreaterThan, priceLessThan } = queryParams

            if (validator.isValid(sortOrder)) {
                if (sortOrder == "ascending") sortOrder = 1
                if (sortOrder == "decending") sortOrder = -1
            }

            sort.price = sortOrder

            if (validator.isValid(productId) && validator.isValidObjectId(productId)) {
                filterQuery['productId'] = productId
            }

            if (validator.isValid(title)) {
                filterQuery['title'] = { $regex: `.*${title.trim()}.*` }
            }

            if (validator.isValid(priceGreaterThan)) {
                filterQuery['price'] = { $gte: priceGreaterThan }
            }

            if (validator.isValid(priceLessThan)) {
                filterQuery['price'] = { $lte: priceLessThan }
            }

            if (validator.isValid(availableSizes)) {
                const availableSizesArr = availableSizes.trim().split(',').map(availableSizes => availableSizes.trim());
                filterQuery['availableSizes'] = { $all: availableSizesArr }
            }
        }

        const products = await productModel.find(filterQuery).sort(sort)

        if (Array.isArray(products) && products.length === 0) {
            res.status(404).send({ status: false, message: 'No products found' })
            return
        }

        res.status(200).send({ status: true, message: 'Products list', data: products })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!validator.isValid(productId)) {
            res.status(400).send({ status: false, message: `productId is required` })
            return
        }

        if (!validator.isValidObjectId(productId)) {
            res.status(400).send({ status: false, message: `${productId} is not a valid user id` })
            return
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false, deletedAt: null })

        if (!product) {
            res.status(404).send({ status: false, message: "Product not found" })

        }

        res.status(200).send({ status: true, message: "Product Details", data: product })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const updateProduct = async function (req, res) {
    try {
        const requestBody = req.body.json

        const productId = req.params.productId

        const files = req.files

        // Validation stats
        if (!validator.isValid(productId)) {
            res.status(400).send({ status: false, message: `ProductId is required` })
            return
        }

        if (!validator.isValidObjectId(productId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        if (!validator.isValid(requestBody) && !files) {
            res.status(400).send({ status: false, message: 'Invalid request , Product unmodified ' })
            return
        }

        let request = validator.isValid(requestBody) ? JSON.parse(requestBody) : {}

        if (!validator.isValidRequestBody(request) && !files) {
            res.status(400).send({ status: true, message: 'No paramateres passed. Product unmodified' })
            return
        }

        // Extract params

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = request;

        let product = await productModel.findOne({ _id: productId, isDeleted: false, deletedAt: null })

        if (!product) {
            res.status(404).send({ Status: false, msg: "Product doesn't exist" })
            return
        };

        const updatedProductData = {}

        const isTitleAlreadyUsed = await productModel.findOne({ title });

        if (isTitleAlreadyUsed) {
            if (!(product.title == title)) {
                res.status(400).send({ status: false, message: `${title} is already used` })
                return
            }
        }

        if (validator.isValid(title)) {
            if (!validator.isValidString(title)) {
                res.status(400).send({ status: false, message: 'Title should be a string' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['title'] = title
        }

        if (validator.isValid(description)) {
            if (!validator.isValidString(description)) {
                res.status(400).send({ status: false, message: 'Description should be a string' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['description'] = description
        }

        if (validator.isValid(price)) {
            if (!validator.isValidNumber(price)) {
                res.status(400).send({ status: false, message: 'Price should be a number' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['price'] = price
        }

        if (validator.isValid(currencyId)) {
            if (!validator.isValidString(currencyId)) {
                res.status(400).send({ status: false, message: 'currencyId should be a string' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['currencyId'] = currencyId
        }

        if (validator.isValid(currencyFormat)) {
            if (!validator.isValidString(currencyFormat)) {
                res.status(400).send({ status: false, message: 'currencyFormat should be a string' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['currencyFormat'] = currencyFormat
        }

        if (validator.isValid(isFreeShipping)) {
            if (!validator.isValidBoolean(isFreeShipping)) {
                res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['isFreeShipping'] = isFreeShipping
        }

        if (validator.isValid(style)) {
            if (!validator.isValidString(style)) {
                res.status(400).send({ status: false, message: 'style should be a string' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['style'] = style
        }

        if (availableSizes) {
            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$addToSet')) updatedProductData['$addToSet'] = {}

            if (validator.isArray(availableSizes)) {
                if (!validator.isValidSize(availableSizes)) {
                    res.status(400).send({ status: false, message: `AvailableSizes Should be among ${systemConfig.sizeEnumArray.join(', ')}` })
                    return
                };

                updatedProductData['$addToSet']['availableSizes'] = { $each: [...availableSizes] }
            }
            if (validator.isValidString(availableSizes)) {
                if (!validator.isValidSize(availableSizes)) {
                    res.status(400).send({ status: false, message: `AvailableSizes Should be among ${systemConfig.sizeEnumArray.join(', ')}` })
                    return
                };

                updatedProductData['$addToSet']['availableSizes'] = availableSizes
            }
        }

        if (validator.isValid(installments)) {
            if (!validator.isValidNumber(price)) {
                res.status(400).send({ status: false, message: 'Price should be a number' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            updatedProductData['$set']['installments'] = installments
        }

        if (validator.isValid(files[0])) {
            if (!Object.prototype.hasOwnProperty.call(updatedProductData, '$set')) updatedProductData['$set'] = {}
            let productImage = await aws.uploadFile(files[0])
            updatedProductData['$set']['productImage'] = productImage
        }

        // Extraction Ends

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updatedProductData, { new: true })

        res.status(200).send({ status: true, message: 'Product Details Updated', data: updatedProduct });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const deleteProductByID = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false, deletedAt: null })

        if (!product) {
            res.status(404).send({ status: false, message: `Product not found` })
        }

        await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } })
        res.status(200).send({ status: true, message: `Product deleted successfully` })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = {
    registerProduct,
    getProductById,
    updateProduct,
    deleteProductByID,
    listProducts
}