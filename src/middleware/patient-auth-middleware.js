import jwt from "jsonwebtoken"; // For verifying JWT
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// Middleware to verify the Bearer token and set PatientId in the request body
const patientMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  
  // The token is typically in the format "Bearer <token>"
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    // Verify the token (use your JWT secret from environment variables)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    // Assuming the token contains the PatientId (or a way to look it up)
    const patientId = decoded.patientId;
    if (!patientId) {
      return res.status(401).json({ message: "PatientId not found in token" });
    }

    // Set the PatientId in the request body (or request object)
    req.patientId = patientId;

    // Move to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default patientMiddleware;
