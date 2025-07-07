const jwt = require('jsonwebtoken');
const Expert = require('../models/Expert'); // Assuming you have an Expert model

const expertAuthMiddleware = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use environment variable for secret

            req.expert = await Expert.findById(decoded.id).select('-password');
            if (!req.expert) {
                return res.status(401).json({ message: 'Not authorized, expert not found' });
            }
            next();
        } catch (error) {
            console.error('Error in expertAuthMiddleware:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { expertAuthMiddleware }; 