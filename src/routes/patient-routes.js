import express from "express";
import {
  bookAppointment,
  checkQueueStatus,
  registerPatient,
  signinPatient,
} from "../controllers/patient-controllers.js";
import patientMiddleware from "../middleware/patient-auth-middleware.js";

const router = express.Router();

router.post("/register", registerPatient);
router.post("/signin", signinPatient);
router.post("/book-appointment", patientMiddleware, bookAppointment);
router.get("/check-appointment-status/:appointmentId", checkQueueStatus);

export default router;
