import express from "express";
import { bookAppointment, registerPatient } from "../controllers/patient-controllers.js";
import verifyToken from "../middleware/auth-middleware.js";

const router = express.Router();

router.post("/register", registerPatient);
router.post("/book-appointment", verifyToken, bookAppointment)

export default router;