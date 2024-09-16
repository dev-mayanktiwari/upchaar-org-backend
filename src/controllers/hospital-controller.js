import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../utils/generate-prismaclient-util.js";
import client from "../utils/redisClient.js";

export const registerHospital = async (req, res) => {
  const {
    name,
    email,
    contact,
    password,
    departments,
    zipcode,
    location,
    rating,
  } = req.body;
  console.log(req.body);
  // Check if the hospital email already exists
  const existingHospital = await prisma.hospital.findUnique({
    where: { email: email },
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
        contact,
        location,
        zipcode,
        rating,
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
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
        location: true,
        departments: true,
        zipcode: true,
        rating: true,
        beds: {
          select: {
            totalAvailableBeds: true,
            totalBeds: true,
            icu: {
              select: {
                totalBed: true,
                availableBed: true,
              },
            },
            general: {
              select: {
                totalBed: true,
                availableBed: true,
              },
            },
            premium: {
              select: {
                totalBed: true,
                availableBed: true,
              },
            },
          },
        },
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

  if (!["Completed", "Cancelled", "Confirmed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId, 10) },
      include: { hospital: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.hospital.id !== hospitalId) {
      return res.status(403).json({
        error: "Forbidden: Appointment does not belong to your hospital",
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(appointmentId, 10) },
      data: { appointmentStatus: status },
    });

    const pendingQueueKey = `hospital:${appointment.hospitalId}:department:${appointment.departmentId}:pending-queue`;
    const confirmedQueueKey = `hospital:${appointment.hospitalId}:department:${appointment.departmentId}:confirmed-queue`;

    if (status === "Confirmed") {
      await client.zRem(pendingQueueKey, String(appointmentId));
      await client.zAdd(confirmedQueueKey, {
        score: updatedAppointment.id,
        value: String(appointmentId),
      });
    } else if (status === "Cancelled" || status === "Completed") {
      await client.zRem(pendingQueueKey, String(appointmentId));
      await client.zRem(confirmedQueueKey, String(appointmentId));
    }

    res.status(200).json({
      message: "Appointment status updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ error: "Error updating appointment status" });
  }
};

export const setBedDetails = async (req, res) => {
  const hospitalId = req.hospitalId;
  const {
    totalICU,
    availableICU,
    totalGeneral,
    availableGeneral,
    totalPremium,
    availablePremium,
  } = req.body;

  if (
    !hospitalId ||
    !totalICU ||
    !availableICU ||
    !totalGeneral ||
    !availableGeneral ||
    !totalPremium ||
    !availablePremium
  ) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    const totalBed =
      parseInt(totalICU, 10) +
      parseInt(totalPremium, 10) +
      parseInt(totalGeneral, 10);

    const totalAvailableBed =
      parseInt(availableICU, 10) +
      parseInt(availablePremium, 10) +
      parseInt(availableGeneral, 10);

    const updatedBedCount = await prisma.bedCount.upsert({
      where: {
        hospitalId: parseInt(hospitalId, 10),
      },
      update: {
        totalBeds: totalBed,
        totalAvailableBeds: totalAvailableBed,
        icu: {
          update: {
            totalBed: parseInt(totalICU, 10),
            availableBed: parseInt(availableICU),
          },
        },
        general: {
          update: {
            totalBed: parseInt(totalGeneral, 10),
            availableBed: parseInt(availableGeneral, 10),
          },
        },
        premium: {
          update: {
            totalBed: parseInt(totalPremium, 10),
            availableBed: parseInt(availablePremium, 10),
          },
        },
      },
      create: {
        hospitalId: parseInt(hospitalId, 10),
        totalBeds: totalBed,
        totalAvailableBeds: totalAvailableBed,
        icu: {
          create: {
            totalBed: parseInt(totalICU, 10),
            availableBed: parseInt(availableICU, 10),
          },
        },
        general: {
          create: {
            totalBed: parseInt(totalGeneral, 10),
            availableBed: parseInt(availableGeneral, 10),
          },
        },
        premium: {
          create: {
            totalBed: parseInt(totalPremium, 10),
            availableBed: parseInt(availablePremium, 10),
          },
        },
      },
      select: {
        totalAvailableBeds: true,
        totalBeds: true,
        icu: true,
        general: true,
        premium: true,
      },
    });

    if (!updatedBedCount) {
      return res.status(500).json({
        error: "Unable to add bed details",
      });
    }

    return res.status(201).json({
      message: "Bed details updated successfully",
      details: updatedBedCount,
    });
  } catch (error) {
    console.log("Error in updating bed details:", error);
    return res.status(500).json({
      error: "Error in updating bed details",
    });
  }
};

export const getBedDetails = async (req, res) => {
  const { hospitalId } = req;

  if (!hospitalId) {
    return res.status(400).json({
      error: "Hospital ID is required.",
    });
  }

  try {
    const bedDetails = await prisma.bedCount.findUnique({
      where: { hospitalId },
    });

    if (!bedDetails) {
      return res.status(404).json({
        error: "Bed details not found for the specified hospital.",
      });
    }

    return res.status(200).json({
      message: "Details found.",
      details: bedDetails,
    });
  } catch (error) {
    console.error("Error retrieving bed details:", error);
    return res.status(500).json({
      error: "An error occurred while fetching bed details.",
    });
  }
};

export const getDepartmentsProtected = async (req, res) => {
  const { hospitalId } = req;

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

export const addMedicine = async (req, res) => {
  const { name, quantity, expiryDate } = req.body;
  const { hospitalId } = req;
  try {
    const newMedicine = await prisma.medicineInventory.create({
      data: {
        name,
        quantity: parseInt(quantity, 10),
        expiryDate: new Date(expiryDate),
        hospitalId,
      },
    });
    return res.status(201).json(newMedicine);
  } catch (error) {
    console.log("Error in adding medicine", error);
    return res.status(500).json({ error: "Failed to add medicine" });
  }
};

export const viewMedicine = async (req, res) => {
  const { hospitalId } = req;

  try {
    const medicines = await prisma.medicineInventory.findMany({
      where: { hospitalId: parseInt(hospitalId, 10) },
    });
    return res.json(medicines);
  } catch (error) {
    console.log("Error in viewing medicine", error);
    return res.status(500).json({ error: "Failed to retrieve medicines" });
  }
};

export const editMedicine = async (req, res) => {
  const { id } = req.params;
  const { name, quantity, expiryDate } = req.body;

  try {
    const updatedMedicine = await prisma.medicineInventory.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        quantity: parseInt(quantity, 10),
        expiryDate: new Date(expiryDate),
      },
    });
    return res.json(updatedMedicine);
  } catch (error) {
    console.log("Error in updating medicine", error);
    return res.status(500).json({ error: "Failed to update medicine" });
  }
};

export const deleteMedicine = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.medicineInventory.delete({
      where: { id: parseInt(id, 10) },
    });
    return res.status(204).json({
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleting medicine", error);
    return res.status(500).json({ error: "Failed to delete medicine" });
  }
};

export const getHospitalDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const hospital = await prisma.hospital.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      select: {
        name: true,
        contact: true,
        email: true,
        location: true,
        departments: true,
        zipcode: true,
        rating: true,
        beds: {
          select: {
            totalAvailableBeds: true,
            totalBeds: true,
            icu: {
              select: {
                totalBed: true,
                availableBed: true,
              },
            },
            general: {
              select: {
                totalBed: true,
                availableBed: true,
              },
            },
            premium: {
              select: {
                totalBed: true,
                availableBed: true,
              },
            },
          },
        },
      },
    });

    if (!hospital) {
      return res.status(500).json({
        error: "Hospital not found",
      });
    }

    return res.status(200).json({
      hospital: hospital,
    });
  } catch (e) {
    console.log("Error in finding hospital", e);
    return res.status(500).json({
      error: "Server error",
    });
  }
};
