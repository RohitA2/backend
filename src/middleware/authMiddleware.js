
// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');

// dotenv.config();

// const authMiddleware = (req, res, next) => {
//   try {
//     // Get token from Authorization header
//     const token = req.header('Authorization').replace('Bearer ', '');
//     console.log("i am from middleware token:", token);

//     if (!token) {
//       return res.status(401).json({ message: 'Authentication token is required' });
//     }

//     // Verify the token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// console.log("i am from middleware decoded:", decoded);
//     // Attach user info to request object for use in the route handler
//     req.user = decoded;
//     console.log(`Authenticated user ID: ${req.user.id}`);
    
//     next();  // Proceed to the next middleware/handler
//   } catch (error) {
//     return res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };

// module.exports = authMiddleware;


const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check header existence
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    // 2️⃣ Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }

    const token = authHeader.split(' ')[1];
    console.log("Middleware token:", token);

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    // 4️⃣ Attach user info
    req.user = decoded;
    console.log(`Authenticated user ID: ${decoded.id}`);

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
