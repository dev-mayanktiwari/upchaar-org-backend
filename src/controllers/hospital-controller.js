import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../utils/generate-prismaclient-util.js";

export const registerHospital = async (req, res) => {
  const { name, email, password, location, departments } = req.body;

  // Check if the hospital email already exists
  const existingHospital = await prisma.hospital.findUnique({
    where: { email },
  });
  if (existingHospital) {
    return res.status(400).json({ message: "Hospital already exists" });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    // Create the new hospital
    const hospital = await prisma.hospital.create({
      data: {
        name,
        email,
        password: hashedPassword,
        location,
        departments: {
          create: departments.map((dept) => ({
            name: dept.name,
            head: dept.head,
          })),
        },
      },
    });

    // Generate a JWT token
    const token = jwt.sign(
      { hospitalId: hospital.id, email: hospital.email },
      process.env.JWT_SECRET
    );

    // Return success response with the token
    res.status(201).json({
      message: "Hospital signed up successfully",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during signup" });
  }
};

export const addDepartments = async (req, res) => {
  try {
    const { departments } = req.body;
    const hospitalId = req.hospitalId; // Extract hospitalId from the JWT token

    if (!hospitalId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Hospital ID not found" });
    }

    // Check if hospital exists
    const existingHospital = await prisma.hospital.findUnique({
      where: { id: parseInt(hospitalId) },
    });

    if (!existingHospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Add departments to the hospital
    const updatedHospital = await prisma.hospital.update({
      where: { id: parseInt(hospitalId) },
      data: {
        departments: {
          create: departments.map((dept) => ({
            name: dept.name,
            head: dept.head,
          })),
        },
      },
      include: {
        departments: true, // Include the departments in the response
      },
    });

    return res.status(200).json({
      message: "Departments added successfully",
      hospital: updatedHospital,
    });
  } catch (error) {
    console.error("Error adding departments:", error);
    return res
      .status(500)
      .json({ message: "Error adding departments", error: error.message });
  }
};

export const getDepartmentsByHospital = async (req, res) => {
  const { hospitalId } = req.params;

  try {
    // Fetch all departments for the specified hospital
    const departments = await prisma.department.findMany({
      where: { hospitalId: parseInt(hospitalId, 10) },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching departments" });
  }
};

export const signinHospital = async (req, res) => {
  const { email, password } = req.body;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { email },
    });

    if (!hospital) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { hospitalId: hospital.id, email: hospital.email },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const searchHospitals = async (req, res) => {
  const { query = "" } = req.query; // Extract search query from query parameters, default to empty string

  try {
    const hospitals = await prisma.hospital.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive", // Case-insensitive search
            },
          },
          {
            location: {
              contains: query,
              mode: "insensitive", // Case-insensitive search
            },
          },
        ],
      },
      include: {
        departments: true,
        appointments: false,
        password: false,
        beds: true,
      },
    });

    res.status(200).json(hospitals);
  } catch (error) {
    console.error("Error searching hospitals:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAppointments = async (req, res) => {
  const hospitalId = req.hospitalId;

  if (!hospitalId) {
    return res.status(400).json({
      error: "Hospital id not found",
    });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { hospitalId: parseInt(hospitalId) },
      include: {
        patient: { select: { name: true, id: true, password: false } },
        hospital: { select: { name: true, id: true, password: false } },
      },
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving appointments" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;
  const hospitalId = req.hospitalId;
  if (!["Completed", "Cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // Fetch the appointment to check its hospital association
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { hospital: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if the appointment belongs to the hospital associated with the authenticated user
    if (appointment.hospital.id !== hospitalId) {
      return res.status(403).json({
        error: "Forbidden: Appointment does not belong to your hospital",
      });
    }

    // Update the appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(appointmentId) },
      data: { status },
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating appointment status" });
  }
};

export const setBedDetails = async (req, res) => {
  const hospitalId = req.hospitalId;
  const { totalBed, availableBed } = req.body;

  if (!hospitalId || !totalBed || !availableBed) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    const hospitalBedDetails = await prisma.bedCount.upsert({
      where: {
        hospitalId,
      },
      create: {
        hospitalId,
        totalBed,
        availableBed,
      },
      update: {
        totalBed,
        availableBed,
      },
    });

    if (!hospitalBedDetails) {
      return res.status(500).json({
        error: "Unable to add bed details",
      });
    }

    return res.status(201).json({
      message: "Bed details updated successfully",
      details: hospitalBedDetails,
    });
  } catch (error) {
    console.log("Error in updating bed details:", error);
    return res.status(500).json({
      error: "Error in updating bed details",
    });
  }
};
