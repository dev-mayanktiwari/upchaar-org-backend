import express from "express";
import {
  bookAppointment,
  registerPatient,
  signinPatient
} from "../controllers/patient-controllers.js";
import patientMiddleware from "../middleware/patient-auth-middleware.js";

const router = express.Router();

router.post("/register", registerPatient);
router.post("/signin", signinPatient);
router.post("/book-appointment", patientMiddleware, bookAppointment);

export default router;
