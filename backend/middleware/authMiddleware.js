const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('User not found');
            }

            if (req.user.isBlocked) {
                res.status(403).json({ message: 'Account is blocked' });
                return;
            }

            next();
            return; // Important: prevent further execution
        } catch (error) {
            console.error('[Auth] JWT verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized - Invalid or expired token' });
            return; // Important: prevent further execution
        }
    }

    // No token found
    res.status(401).json({ message: 'Not authorized - No token provided' });
};

const optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            console.error('[Optional Auth] JWT verification failed:', error.message);
        }
    }
    next();
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden - Admin access required' });
    }
};

const partner = (req, res, next) => {
    if (req.user && req.user.role === 'partner') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden - Partner access required' });
    }
};

module.exports = { protect, admin, partner, optionalAuth };
