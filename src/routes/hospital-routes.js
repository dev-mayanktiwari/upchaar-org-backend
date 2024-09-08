import express from "express";
import {
  registerHospital,
  addDepartments,
  getDepartmentsByHospital,
  signinHospital,
  searchHospitals,
} from "../controllers/hospital-controller.js";
import hospitalMiddleware from "../middleware/hospital-auth-middleware.js";

const router = express.Router();

router.post("/register", registerHospital);
router.post("/signin", signinHospital);
router.post("/add-departments", hospitalMiddleware, addDepartments);
router.get("/search", searchHospitals);
router.get("/departments/:hospitalId", getDepartmentsByHospital);

export default router;
