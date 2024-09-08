import express from "express";
import { registerHospital, addDepartments, getDepartments, signinHospital } from "../controllers/hospital-controller.js";
import hospitalMiddleware from "../middleware/hospital-auth-middleware.js";

const router = express.Router();

router.post("/register", registerHospital);
router.post("/add-departments", hospitalMiddleware, addDepartments);
router.post("/signin", signinHospital);
router.get("/departments/:hospitalId", getDepartments);

export default router;
