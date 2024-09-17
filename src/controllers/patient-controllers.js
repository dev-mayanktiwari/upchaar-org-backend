import prisma from "../utils/generate-prismaclient-util.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import client from "../utils/redisClient.js";

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
        contact: body.contact,
        age: parseInt(body.age, 10),
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

export const bookAppointment = async (req, res) => {
  const { hospitalId, departmentId, title, time } = req.body;
  const patientId = req.patientId;

  if (!patientId) {
    return res.status(400).json({ error: "Patient ID not found" });
  }

  try {
    // Create the appointment
    console.log(req.body);
    let appointment = await prisma.appointment.create({
      data: {
        title,
        time,
        appointmentStatus: "Pending",
        patientId,
        hospitalId: parseInt(hospitalId, 10),
        departmentId: parseInt(departmentId, 10),
      },
    });

    const queueKey = `hospital:${hospitalId}:department:${departmentId}:pending-queue`;
    await client.zAdd(queueKey, {
      score: appointment.id,
      value: String(appointment.id),
    });

    return res.status(201).json({
      message: "Appointment created",
      appointment,
    });
  } catch (error) {
    console.error("Error in creating appointment:", error);
    return res.status(500).json({ error: "Error in creating appointment" });
  }
};

export const checkQueueStatus = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(appointmentId) },
      select: {
        id: true,
        hospitalId: true,
        appointmentStatus: true,
        departmentId: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (
      ["Pending", "Cancelled", "Completed"].includes(
        appointment.appointmentStatus
      )
    ) {
      return res.status(200).json({ status: appointment.appointmentStatus });
    }

    const queueKey = `hospital:${appointment.hospitalId}:department:${appointment.departmentId}:confirmed-queue`;

    const userPosition = await client.zRank(queueKey, String(appointmentId));
    const totalQueueLength = await client.zCard(queueKey);

    if (userPosition === null) {
      return res
        .status(404)
        .json({ error: "Appointment not found in the queue" });
    }

    return res.status(200).json({
      message: "Queue status retrieved successfully",
      status: "Confirmed",
      queue: {
        userPosition: userPosition + 1,
        peopleAhead: userPosition,
        totalQueueLength,
      },
    });
  } catch (error) {
    console.error("Error retrieving queue status:", error);
    return res.status(500).json({ error: "Error retrieving queue status" });
  }
};

export const getAllAppointments = async (req, res) => {
  const patientId = req.patientId;

  if (!patientId) {
    return res.status(400).json({
      error: "Patient ID is required",
    });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: parseInt(patientId, 10),
      },
    });

    if (appointments.length === 0) {
      return res.status(404).json({
        error: "No appointments found for the given user",
      });
    }

    return res.status(200).json({
      appointments: appointments,
    });
  } catch (err) {
    console.error("Error finding appointments", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
