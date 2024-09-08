import prisma from "../utils/generate-prismaclient-util.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const registerPatient = async (req, res) => {
  const body = req.body;
  if (!body) {
    return res.status(400).json({
      error: "No data for register",
    });
  }

  try {
    const existingUser = await prisma.patient.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        email: body.email,
        age: body.age,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        password: false,
      },
    });

    // console.log(patient.id);
    const token = jwt.sign(
      { patientId: patient.id, email: patient.email },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      message: "Patient registered successfully",
      patient,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Failed to register patient",
    });
  }
};

export const bookAppointment = async (req, res) => {
  const { hospitalId, departmentId, title, time } = req.body;
  const patientId = req.patientId; // Get patient ID from authenticated user

  if (!patientId) {
    return res.status(400).json({ error: "PatientId not found" });
  }

  try {
    // Validate input
    if (!hospitalId || !departmentId || !title || !time) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Check if the hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: {
        id: hospitalId,
      },
    });
    if (!hospital) {
      return res.status(400).json({
        error: "Hospital not found",
      });
    }

    // Check if the department exists in the given hospital
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      include: {
        hospital: true, // Include hospital information
      },
    });

    if (!department || department.hospital.id !== hospitalId) {
      return res.status(400).json({
        error: "Requested department does not exist in the given hospital",
      });
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        time: new Date(time), // Ensure time is a Date object
        status: "Scheduled",
        patient: { connect: { id: patientId } },
        hospital: { connect: { id: hospitalId } },
        department: { connect: { id: departmentId } },
      },
      include: {
        patient: { select: { name: true } },
        hospital: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    return res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const signinPatient = async (req, res) => {
  const { email, password } = req.body;

  try {
    const patient = await prisma.patient.findUnique({
      where: { email },
    });

    if (!patient) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, patient.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { patientId: patient.id, email: patient.email },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
