const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('No authorization header');
        return res.status(401).json({ msg: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('No token in authorization header');
        return res.status(401).json({ msg: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        console.log('Token verified for user:', decoded.id);
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ msg: 'Invalid token' });
    }
};

module.exports = verifyToken; 