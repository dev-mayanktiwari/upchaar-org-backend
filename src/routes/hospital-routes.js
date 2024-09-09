import express from "express";
import {
  registerHospital,
  addDepartments,
  getDepartmentsByHospital,
  signinHospital,
  searchHospitals,
  getAppointments,
  updateAppointmentStatus,
  setBedDetails,
} from "../controllers/hospital-controller.js";
import hospitalMiddleware from "../middleware/hospital-auth-middleware.js";

const router = express.Router();

router.post("/register", registerHospital);
router.post("/signin", signinHospital);
router.post("/add-departments", hospitalMiddleware, addDepartments);
router.post("/update-bed-details", hospitalMiddleware, setBedDetails);
router.get("/search", searchHospitals);
router.get("/departments/:hospitalId", getDepartmentsByHospital);

// appointment routes
router.get("/appointments", hospitalMiddleware, getAppointments);
router.patch(
  "/appointments/:appointmentId",
  hospitalMiddleware,
  updateAppointmentStatus
);

export default router;
