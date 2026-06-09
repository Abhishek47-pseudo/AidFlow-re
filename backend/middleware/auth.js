import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to the request
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error('❌ JWT Verification Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware for role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles || !req.user.roles.some(role => roles.includes(role))) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this route' });
        }

        // If user is accessing an Admin role feature, require verification
        const requiresAdmin = roles.some(r => ['Super Admin', 'Branch Manager', 'Admin'].includes(r));
        const userAttemptingAdmin = req.user.userClass === 'Admin' && req.user.roles.some(r => roles.includes(r));
        
        if (requiresAdmin && userAttemptingAdmin && req.user.verification?.status !== 'Verified') {
            return res.status(403).json({ message: 'Forbidden: Admin account is pending verification' });
        }
        
        next();
    };
};

export { protect, authorize };


