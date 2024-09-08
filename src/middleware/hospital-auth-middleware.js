import jwt from "jsonwebtoken";

// Middleware to verify the JWT token
const hospitalMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the hospitalId or user info to the request object
    req.hospitalId = decoded.hospitalId; // Assuming the token contains the hospitalId

    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

export default hospitalMiddleware;
