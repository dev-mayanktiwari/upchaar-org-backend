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
  const patientId = req.patientId;

  if (!patientId) {
    return res.status(400).json({ error: "Patient ID not found" });
  }

  try {
    // Create the appointment
    let appointment = await prisma.appointment.create({
      data: {
        title,
        time,
        status: "Scheduled",
        patientId,
        hospitalId: parseInt(hospitalId, 10),
        departmentId: parseInt(departmentId, 10),
      },
    });

    if (departmentId) {
      // Handle queue management
      const queue = await handleQueueManagement(departmentId, appointment.id);

      // Update the appointment with the queue details
      appointment = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          queueId: queue.id,
          queuePosition: queue.currentPosition,
        },
      });
    }

    return res.status(201).json({
      message: "Appointment created",
      appointment,
    });
  } catch (error) {
    console.error("Error in creating appointment:", error);
    return res.status(500).json({ error: "Error in creating appointment" });
  }
};

// Function to manage queue
const handleQueueManagement = async (departmentId, appointmentId) => {
  let queue = await prisma.queue.findUnique({
    where: { departmentId },
  });

  if (!queue) {
    queue = await prisma.queue.create({
      data: {
        departmentId,
        currentPosition: 1,
        lastUpdated: new Date(),
      },
    });
  } else {
    await prisma.queue.update({
      where: { id: queue.id },
      data: {
        currentPosition: { increment: 1 },
        lastUpdated: new Date(),
      },
    });
  }

  return queue;
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

export const checkQueueStatus = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(appointmentId) },
      include: {
        queue: true, // Include queue information
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (!appointment.queueId) {
      return res
        .status(404)
        .json({ error: "Queue not found for this appointment" });
    }

    // Find the queue
    const queue = await prisma.queue.findUnique({
      where: { id: appointment.queueId },
      include: {
        appointments: true, // Include all appointments in the queue
      },
    });

    if (!queue) {
      return res.status(404).json({ error: "Queue not found" });
    }

    // Ensure queue appointments are sorted by position
    const sortedAppointments = queue.appointments.sort(
      (a, b) => a.queuePosition - b.queuePosition
    );

    // Calculate the user's position and the number of people ahead
    const userPosition = appointment.queuePosition;
    const peopleAhead = sortedAppointments.filter(
      (app) => app.queuePosition < userPosition
    ).length;

    return res.status(200).json({
      message: "Queue status retrieved successfully",
      queue: {
        currentPosition: queue.currentPosition,
        userPosition,
        peopleAhead,
      },
    });
  } catch (error) {
    console.error("Error retrieving queue status:", error);
    return res.status(500).json({ error: "Error retrieving queue status" });
  }
};
