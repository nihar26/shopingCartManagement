const multer = require('multer')

const bcrypt = require('bcrypt');

const { validator, aws, jwt } = require('../utils')

const { systemConfig } = require('../configs')

const { userModel } = require('../models');

const registerUser = async function (req, res) {
    try {
        const requestBody = req.body.json;

        const files = req.files

        if (!validator.isValid(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request , Body is required' })
            return
        }
        // if(!requestBody){
        //     res.status(401).send({status : false , msg : "request body not present" })
        // }

        if (!validator.isValidRequestBody(JSON.parse(requestBody))) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide User details' })
            return
        };

        let { fname, lname, email, phone, password, address, bothAddressSame } = JSON.parse(requestBody.trim());

        // Validation Starts

        if (!validator.isValid(fname)) {
            res.status(400).send({ status: false, message: 'First Name is Required' })
            return
        };

        if (!validator.isValid(lname)) {
            res.status(400).send({ status: false, message: 'Last Name is Required' })
            return
        };

        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, message: 'Email is Required' })
            return
        };

        if (!validator.isValid(phone)) {
            res.status(400).send({ status: false, message: 'Phone is Required' })
            return
        };

        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, message: 'Password is Required' })
            return
        };

        if (!validator.isValid(address)) {
            res.status(400).send({ status: false, message: 'address is Required' })
            return
        };

        if (bothAddressSame === true) {
            if (!Object.prototype.hasOwnProperty.call(address, 'billing')) address['billing'] = address['shipping']

            // if (!Object.prototype.hasOwnProperty.call(address["billing"], 'street')) address["billing"]['street'] = address.shipping.street
            // address["billing"]['street'] = address.shipping.street

            // if (!Object.prototype.hasOwnProperty.call(address["billing"], 'city')) address["billing"]['city'] = address.shipping.city
            // address["billing"]['city'] = address.shipping.city

            // if (!Object.prototype.hasOwnProperty.call(address["billing"], 'pincode')) address["billing"]['pincode'] = address.shipping.pincode
            // address["billing"]['pincode'] = address.shipping.pincode
        }

        if (!validator.isValid(address.shipping)) {
            res.status(400).send({ status: false, message: 'Shipping address is Required' })
            return
        };

        if (!validator.isValid(address.billing)) {
            res.status(400).send({ status: false, message: 'Billing address is Required' })
            return
        };

        if (!validator.isValid(address.shipping.street)) {
            res.status(400).send({ status: false, message: 'Shipping street address is Required' })
            return
        };

        if (!validator.isValid(address.shipping.city)) {
            res.status(400).send({ status: false, message: 'Shipping city address is Required' })
            return
        };

        if (!validator.isValid(address.shipping.pincode)) {
            res.status(400).send({ status: false, message: 'Shipping pincode address is Required' })
            return
        };

        if (!validator.isValid(address.billing.street)) {
            res.status(400).send({ status: false, message: 'Billing street address is Required' })
            return
        };

        if (!validator.isValid(address.billing.city)) {
            res.status(400).send({ status: false, message: 'Billing city address is Required' })
            return
        };

        if (!validator.isValid(address.billing.pincode)) {
            res.status(400).send({ status: false, message: 'Billing pincode address is Required' })
            return
        };

        if (!validator.isValid(files[0])) {
            res.status(400).send({ status: false, message: 'Profile Image is required' })
            return
        }

        // Parameter type Check

        if (!validator.isValidString(fname)) {
            res.status(400).send({ status: false, message: 'FullName Should be a string' })
            return
        };

        if (!validator.isValidString(lname)) {
            res.status(400).send({ status: false, message: 'LastName Should be a string' })
            return
        };

        if (!validator.validateEmail(email)) {
            res.status(400).send({ status: false, message: 'Email is not a Valid Email' })
            return
        };

        if (!validator.validatePhone(phone)) {
            res.status(400).send({ status: false, message: 'Phone should be a valid phone no and should be a indian phone no' })
            return
        };

        let isEmailAlreadyInUse = await userModel.findOne({ email })

        if (isEmailAlreadyInUse) {
            res.status(400).send({ Status: false, msg: "Email Already exists" })
            return
        };

        let isPhoneAlreadyInUse = await userModel.findOne({ phone })

        if (isPhoneAlreadyInUse) {
            res.status(400).send({ Status: false, msg: "Phone Already exists" })
            return
        };

        if (!validator.isValidString(password)) {
            res.status(400).send({ status: false, message: 'Password Should be a string' })
            return
        };

        if (!validator.PasswordLength(password)) {
            res.status(400).send({ status: false, message: 'Password length should be in range of 8-15' })
            return
        };

        if (!validator.isValidString(address.shipping.street)) {
            res.status(400).send({ status: false, message: 'Shipping street address Should be a string' })
            return
        };

        if (!validator.isValidString(address.shipping.city)) {
            res.status(400).send({ status: false, message: 'Shipping city address Should be a string' })
            return
        };

        // if (!validator.isValidString(address.shipping.pincode)) {
        //     res.status(400).send({ status: false, message: 'Shipping pincode address Should be a string' })
        //     return
        // };

        if (!validator.isValidString(address.billing.street)) {
            res.status(400).send({ status: false, message: 'Billing street address Should be a string' })
            return
        };

        if (!validator.isValidString(address.billing.city)) {
            res.status(400).send({ status: false, message: 'Billing city address Should be a string' })
            return
        };

        // if (!validator.isValidString(address.billing.pincode)) {
        //     res.status(400).send({ status: false, message: 'Billing pincode address Should be a string' })
        //     return
        // };

        // Validation Ends

        let profileImage = await aws.uploadFile(files[0]);

        const salt = await bcrypt.genSalt(systemConfig.salt)

        const hashed = await bcrypt.hash(password, salt);

        // let hashed = hashing.hash(password);

        const userData = {
            fname,
            lname,
            email,
            phone,
            address,
            password: hashed,
            profileImage
        };

        const newUser = await userModel.create(userData)
        res.status(201).send({ status: true, message: 'User created successfully', data: newUser })
    } catch (err) {
        console.log(err)
        res.status(500).send({ Status: false, Msg: err.message })
    }
}


const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!validator.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
            return
        }

        // Extract params
        const { email, password } = requestBody;

        // Validation starts
        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }

        if (!validator.validateEmail(email)) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }

        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }

        // Validation ends

        const User = await userModel.findOne({ email });

        if (!User) {
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return
        }

        const validPassword = await bcrypt.compare(requestBody.password, User.password);

        if (!validPassword) {
            res.status(401).json({ Status: false, message: "Invalid password" });
        }

        const token = await jwt.createToken({ UserId: User._id });

        res.header("Authorization", `Bearer ${token}`);

        res.status(200).send({ status: true, message: `User login successfull`, data: { userId: User._id, token } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


const getUserProfile = async function (req, res) {
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

        res.status(200).send({ status: true, message: "User Profile Details", data: user })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const updateUser = async function (req, res) {
    try {
        const requestBody = req.body.json

        const userId = req.params.userId

        const userIdFromToken = req.UserId

        const files = req.files

        // Validation stats
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

        if (!validator.isValid(requestBody) && !files) {
            res.status(400).send({ status: false, message: 'Invalid request , User unmodified ' })
            return
        }

        let request = validator.isValid(requestBody) ? JSON.parse(requestBody) : {}

        if (!validator.isValidRequestBody(request) && !files) {
            res.status(400).send({ status: true, message: 'No paramateres passed. User unmodified' })
            return
        }

        // Extract params

        let { fname, lname, email, phone, password, address } = request;

        let user = await userModel.findOne({ _id: userId })

        if (!user) {
            res.status(404).send({ Status: false, msg: "User doesn't exist" })
            return
        };

        const updatedUserData = {}

        if (validator.isValid(fname)) {
            if (!Object.prototype.hasOwnProperty.call(updatedUserData, '$set')) updatedUserData['$set'] = {}
            updatedUserData['$set']['fname'] = fname
        }

        if (validator.isValid(lname)) {
            if (!Object.prototype.hasOwnProperty.call(updatedUserData, '$set')) updatedUserData['$set'] = {}
            updatedUserData['$set']['lname'] = lname
        }


        if (validator.isValid(email)) {

            if (!validator.validateEmail(email)) {
                res.status(400).send({ status: false, message: 'Email is not a Valid Email' })
                return
            };

            if (!Object.prototype.hasOwnProperty.call(updatedUserData, '$set')) updatedUserData['$set'] = {}
            updatedUserData['$set']['email'] = email
        }

        const isEmailAlreadyUsed = await userModel.findOne({ email });

        if (isEmailAlreadyUsed) {
            if (!(user.email == email)) {
                res.status(400).send({ status: false, message: `${email} is already used` })
                return
            }
        }

        if (validator.isValid(password)) {

            if (!validator.PasswordLength(password)) {
                res.status(400).send({ status: false, message: 'Password length should be in range of 8-15' })
                return
            };


            if (!Object.prototype.hasOwnProperty.call(updatedUserData, '$set')) updatedUserData['$set'] = {}

            const salt = await bcrypt.genSalt(systemConfig.salt)
            const hashed = await bcrypt.hash(password, salt);

            updatedUserData['$set']['password'] = hashed
        }

        if (validator.isValid(phone)) {

            if (!validator.validatePhone(phone)) {
                res.status(400).send({ status: false, message: 'Phone should be a valid phone no and should be a indian phone no' })
                return
            }

            if (!Object.prototype.hasOwnProperty.call(updatedUserData, '$set')) updatedUserData['$set'] = {}
            updatedUserData['$set']['phone'] = phone
        }


        const isPhoneAlreadyUsed = await userModel.findOne({ phone });

        if (isPhoneAlreadyUsed) {
            if (!(user.phone == phone)) {
                res.status(400).send({ status: false, message: `${phone}  is already used` })
                return
            }
        }

        if (validator.isValid(files[0])) {
            if (!Object.prototype.hasOwnProperty.call(updatedUserData, '$set')) updatedUserData['$set'] = {}
            let profileImage = await aws.uploadFile(files[0])
            updatedUserData['$set']['profileImage'] = profileImage
        }

        if (validator.isValid(address)) {
            if (!Object.prototype.hasOwnProperty.call(updatedUserData, '$set')) updatedUserData['$set'] = {}

            updatedUserData['$set']['address'] = {}

            if (Object.prototype.hasOwnProperty.call(address, 'billing')) updatedUserData['$set']['address']['billing'] = {}
            if (Object.prototype.hasOwnProperty.call(address, 'billing')) {
                Object.prototype.hasOwnProperty.call(address['billing'], 'city') ? updatedUserData['$set']['address']['billing']['city'] = address.billing.city : updatedUserData['$set']['address']['billing']['city'] = user['address']['billing']['city']
                Object.prototype.hasOwnProperty.call(address['billing'], 'street') ? updatedUserData['$set']['address']['billing']['street'] = address.billing.street : updatedUserData['$set']['address']['billing']['street'] = user['address']['billing']['street']
                Object.prototype.hasOwnProperty.call(address['billing'], 'pincode') ? updatedUserData['$set']['address']['billing']['pincode'] = address.billing.pincode : updatedUserData['$set']['address']['billing']['pincode'] = user['address']['billing']['pincode']
            }else{
                updatedUserData['$set']['address']['billing'] = user['address']['billing']
            }

            if (Object.prototype.hasOwnProperty.call(address, 'shipping')) updatedUserData['$set']['address']['shipping'] = {}
            if (Object.prototype.hasOwnProperty.call(address, 'shipping')) {
                Object.prototype.hasOwnProperty.call(address['shipping'], 'city') ? updatedUserData['$set']['address']['shipping']['city'] = address.shipping.city : updatedUserData['$set']['address']['shipping']['city'] = user['address']['shipping']['city']
                Object.prototype.hasOwnProperty.call(address['shipping'], 'street') ? updatedUserData['$set']['address']['shipping']['street'] = address.shipping.street : updatedUserData['$set']['address']['shipping']['street'] = user['address']['shipping']['street']
                Object.prototype.hasOwnProperty.call(address['shipping'], 'pincode') ? updatedUserData['$set']['address']['shipping']['pincode'] = address.shipping.pincode : updatedUserData['$set']['address']['shipping']['pincode'] = user['address']['shipping']['pincode']
            }else{
                updatedUserData['$set']['address']['shipping'] = user['address']['shipping']
            }
        }


        const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, updatedUserData, { new: true })

        res.status(200).send({ status: true, message: 'User Profile Updated', data: updatedUser });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}



module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUser,
}