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
    });

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
  try {
    const { patientId, hospitalId, date } = req.body;

    // Validate that the required fields are provided
    if (!patientId || !hospitalId || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Book appointment
    const newAppointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        patient: { connect: { id: patientId } },
        hospital: { connect: { id: hospitalId } },
      },
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return res.status(500).json({ message: "Something went wrong" });
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
      { id: patient.id, email: patient.email },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
