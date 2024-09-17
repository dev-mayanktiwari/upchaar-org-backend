import express from "express";
import {
  bookAppointment,
  checkQueueStatus,
  registerPatient,
  signinPatient,
  getAllAppointments
} from "../controllers/patient-controllers.js";
import patientMiddleware from "../middleware/patient-auth-middleware.js";

const router = express.Router();

router.post("/register", registerPatient);
router.post("/signin", signinPatient);
router.post("/book-appointment", patientMiddleware, bookAppointment);
router.get("/check-appointment-status/:appointmentId", checkQueueStatus);
router.get("/get-all-appointments", patientMiddleware, getAllAppointments)

export default router;
