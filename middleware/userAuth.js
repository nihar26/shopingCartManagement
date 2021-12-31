const {jwt} = require('../utils')

const userAuth = async (req, res, next) => {
    try {
        const reqtoken = req.header('Authorization')
        if(!reqtoken) {
            res.status(403).send({status: false, message: `Missing authentication token in request`})
            return;
        }

        let token = reqtoken.split(' ')

        const decoded = await jwt.verifyToken(token[1]);

        if(!decoded) {
            res.status(403).send({status: false, message: `Invalid authentication token in request`})
            return;
        }

        req.UserId = decoded.UserId;

        next()
    } catch (error) {
        console.error(`Error! ${error.message}`)
        res.status(500).send({status: false, message: error.message})
    }
}

module.exports = userAuth