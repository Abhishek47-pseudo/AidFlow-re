import dotenv from "dotenv";
dotenv.config(); // ⚠️ Must be FIRST — loads .env before any other module reads process.env

import express from "express";
import cors from "cors";
import csv from "csvtojson";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { Donation, Request } from './models/Inventory.js';

// --- MODEL & UTILITY IMPORTS ---
import User from './models/User.js';
import { InventoryItem } from './models/Inventory.js';
import connectDB from "./db.js";
import generateToken from './utils/tokenGenerator.js';
import emergencyRoutes from './routes/emergency.js';
import agentsRoutes from './routes/agents.js';
import inventoryRoutes from './routes/inventory.js';
import disastersRoutes from './routes/disasters.js';
import dataManagementRoutes from './routes/dataManagement.js';
import { protect, authorize } from './middleware/auth.js'; // Import auth middleware
// -----------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ----------------- CONFIGURATION -----------------
const CSV_FILE_PATH = path.join(__dirname, 'data', 'predictions_with_coords.csv');

const THRESHOLD = 0.5;
const PRESENCE_KEYS = [
  'bridges_any', 'buildings_any', 'roads_any', 'trees_any', 'water_any'
];



// **********************************************
// ********* USER AUTHENTICATION APIS ***********
// **********************************************

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { 
      username, 
      password, 
      firstName, 
      lastName, 
      country, 
      state, 
      city, 
      address, 
      companyType, 
      occupation, 
      volunteerSkills,
      roles, // Array of requested roles
      verificationDetails
    } = req.body;

    // Validate required fields
    if (!username || !password || !firstName || !lastName || !country || !state || !city || !address || !roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "Missing required fields or roles array." });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this username." });
    }

    const adminRoles = ['Super Admin', 'Branch Manager', 'Admin'];
    const generalRoles = ['Victim', 'Volunteer', 'Donor', 'Reporter', 'Community Member'];

    let userClass = 'General User';
    let verificationStatus = 'None';
    
    // Check if they are requesting any admin roles
    const hasAdminRole = roles.some(r => adminRoles.includes(r));
    const hasGeneralRole = roles.some(r => generalRoles.includes(r));

    if (hasAdminRole && hasGeneralRole) {
      return res.status(400).json({ message: "Cannot mix Admin and General User roles." });
    }

    // Validate roles
    const validRoles = hasAdminRole ? adminRoles : generalRoles;
    const invalidRoles = roles.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({ message: `Invalid roles requested: ${invalidRoles.join(', ')}` });
    }

    if (hasAdminRole) {
      userClass = 'Admin';
      verificationStatus = 'Pending';
      if (!verificationDetails) {
        return res.status(400).json({ message: "Verification details are required for administrative roles." });
      }
    }

    const user = await User.create({
      username,
      password,
      firstName,
      lastName,
      country,
      state,
      city,
      address,
      companyType: companyType || 'Individual',
      occupation,
      volunteerSkills: volunteerSkills || [],
      userClass,
      roles,
      verification: {
        status: verificationStatus,
        details: verificationDetails || ''
      },
      roleAuditLog: [{
        action: 'Requested',
        role: roles.join(', '),
        reason: 'Initial Registration'
      }]
    });

    if (user) {
      console.log(`✅ New user registered: ${user.username} (${user.userClass})`);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        userClass: user.userClass,
        roles: user.roles,
        verificationStatus: user.verification.status,
        message: hasAdminRole ? "Registration successful! Awaiting admin verification." : "Registration successful!",
        token: generateToken(user._id, user.userClass, user.roles),
      });
    } else {
      res.status(400).json({ message: "Invalid user data received." });
    }

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors || {}).map(e => e.message).join('; ');
      console.error("❌ Registration Validation Error:", errors);
      return res.status(400).json({ message: errors || "Validation error during registration." });
    }
    
    if (err.code === 11000) {
      console.error("❌ Registration Error: Duplicate username");
      return res.status(400).json({ message: "Username already exists." });
    }

    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        userClass: user.userClass,
        roles: user.roles,
        verificationStatus: user.verification.status,
        token: generateToken(user._id, user.userClass, user.roles),
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
});

// **********************************************
// ********** ADMIN VERIFICATION APIS ***********
// **********************************************

// Get pending admin verifications
app.get("/api/admin/pending-verifications", protect, authorize('Super Admin'), async (req, res) => {
  try {
    const users = await User.find({ "verification.status": "Pending" }).select('-password');
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching pending verifications:", err.message);
    res.status(500).json({ error: "Failed to fetch verifications." });
  }
});

// Approve or reject admin application
app.put("/api/admin/verify/:id", protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'Verified' or 'Rejected'
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.verification.status = status;
    user.roleAuditLog.push({
      action: status === 'Verified' ? 'Granted' : 'Rejected',
      role: user.roles.join(', '),
      changedBy: req.user._id,
      reason: `Verification application ${status.toLowerCase()}`
    });

    await user.save();
    res.json({ message: `User successfully ${status.toLowerCase()}.`, user });
  } catch (err) {
    console.error("❌ Verification Error:", err.message);
    res.status(500).json({ error: "Failed to verify user." });
  }
});

// Modify roles dynamically
app.put("/api/admin/user/:id/roles", protect, authorize('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { newRoles } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.roles = newRoles;
    user.roleAuditLog.push({
      action: 'Modified',
      role: newRoles.join(', '),
      changedBy: req.user._id,
      reason: 'Admin modified roles'
    });

    await user.save();
    res.json({ message: "Roles updated successfully.", user });
  } catch (err) {
    console.error("❌ Role Update Error:", err.message);
    res.status(500).json({ error: "Failed to update roles." });
  }
});

// **********************************************
// ********** INVENTORY MANAGEMENT APIS *********
// **********************************************

// GET /api/inventory/items
app.get("/api/inventory/items", protect, async (req, res) => {
  try {
    const items = await InventoryItem.find({});
    const formattedItems = items.map(item => ({
      ...item._doc,
      id: item._id,
      lastUpdated: new Date(item.updatedAt).toLocaleString(),
    }));
    res.json(formattedItems);
  } catch (err) {
    console.error("❌ Error fetching inventory items:", err.message);
    res.status(500).json({ error: "Failed to fetch inventory items." });
  }
});
// Volunteer donates an item
app.post("/api/volunteer/donate", protect, authorize('Volunteer', 'Super Admin', 'Admin'), async (req, res) => {
    try {
      const { itemName, category, quantity, location } = req.body;
      
      // Use authenticated user's ID
      const volunteerId = req.user._id;
      
      const donation = await Donation.create({ 
        volunteerId, 
        itemName, 
        category, 
        quantity, 
        location 
      });
      
      res.status(201).json({ message: "Donation submitted!", donation });
    } catch (err) {
      console.error("❌ Donation Error:", err.message);
      res.status(500).json({ error: "Failed to submit donation." });
    }
  });
  
  // Fetch all donations for this volunteer
  app.get("/api/volunteer/donations", protect, authorize('Volunteer', 'Super Admin', 'Admin'), async (req, res) => {
    try {
      // Use authenticated user's ID
      const volunteerId = req.user._id;
      const donations = await Donation.find({ volunteerId }).sort({ createdAt: -1 });
      res.json(donations);
    } catch (err) {
      console.error("❌ Error fetching donations:", err.message);
      res.status(500).json({ error: "Failed to fetch donations." });
    }
  });
  // Request items
app.post("/api/requester/request", protect, authorize('Victim', 'Super Admin', 'Admin', 'Branch Manager'), async (req, res) => {
    try {
      const { itemName, category, quantity, location, priority } = req.body;
      
      // Use authenticated user's ID
      const requesterId = req.user._id;
      
      const request = await Request.create({ 
        requesterId, 
        itemName, 
        category, 
        quantity, 
        location, 
        priority 
      });
      
      res.status(201).json({ message: "Request submitted!", request });
    } catch (err) {
      console.error("❌ Request Error:", err.message);
      res.status(500).json({ error: "Failed to submit request." });
    }
  });
  
  // Fetch all requests for this user
  app.get("/api/requester/requests", protect, authorize('Victim', 'Super Admin', 'Admin', 'Branch Manager'), async (req, res) => {
    try {
      // Use authenticated user's ID
      const requesterId = req.user._id;
      const requests = await Request.find({ requesterId }).sort({ createdAt: -1 });
      res.json(requests);
    } catch (err) {
      console.error("❌ Error fetching requests:", err.message);
      res.status(500).json({ error: "Failed to fetch requests." });
    }
  });

  // User marks their own request as fulfilled
  app.put("/api/requester/fulfill/:id", protect, authorize('Victim'), async (req, res) => {
    try {
      const requestId = req.params.id;
      const { notes } = req.body;
      
      // Verify the request belongs to the user
      const request = await Request.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found." });
      }
      
      if (request.requesterId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You can only update your own requests." });
      }

      const updatedRequest = await Request.findByIdAndUpdate(
        requestId, 
        { 
          status: 'fulfilled', 
          fulfilledAt: new Date(),
          notes: notes || 'Marked as fulfilled by user'
        }, 
        { new: true }
      );

      res.json({ message: "Request marked as fulfilled.", request: updatedRequest });
    } catch (err) {
      console.error("❌ User Fulfill Request Error:", err.message);
      res.status(500).json({ error: "Failed to mark request as fulfilled." });
    }
  });
// Approve or reject a donation
app.put("/api/admin/donation/:id", protect, authorize('Super Admin', 'Admin', 'Branch Manager'), async (req, res) => {
    try {
      const { status, approvedBy } = req.body;
      const donation = await Donation.findByIdAndUpdate(
        req.params.id,
        { status, approvedBy },
        { new: true }
      );
  
      // If approved, update inventory count
      if (status === "approved") {
        const existingItem = await InventoryItem.findOne({ name: donation.itemName });
        if (existingItem) {
          existingItem.currentStock += donation.quantity;
          existingItem.save();
        }
      }
  
      res.json({ message: "Donation status updated.", donation });
    } catch (err) {
      console.error("❌ Admin Donation Update Error:", err.message);
      res.status(500).json({ error: "Failed to update donation status." });
    }
  });
  
  // Get all requests for admin/branch manager dashboard
  app.get("/api/admin/requests", protect, authorize('Super Admin', 'Admin', 'Branch Manager'), async (req, res) => {
    try {
      const requests = await Request.find({})
        .populate('requesterId', 'username firstName lastName role')
        .sort({ createdAt: -1 });
      res.json(requests);
    } catch (err) {
      console.error("❌ Error fetching all requests:", err.message);
      res.status(500).json({ error: "Failed to fetch requests." });
    }
  });

  // Update request status (branch manager can update, user can mark as fulfilled)
  app.put("/api/admin/request/:id", protect, authorize('Super Admin', 'Admin', 'Branch Manager', 'Victim'), async (req, res) => {
    try {
      const { status, notes } = req.body;
      const requestId = req.params.id;
      
      // Get the current request
      const currentRequest = await Request.findById(requestId);
      if (!currentRequest) {
        return res.status(404).json({ error: "Request not found." });
      }

      // Role-based permission check
      if (req.user.userClass === 'General User') {
        // Users can only update their own requests and only mark as fulfilled
        if (currentRequest.requesterId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: "You can only update your own requests." });
        }
        if (status !== 'fulfilled') {
          return res.status(403).json({ error: "You can only mark your request as fulfilled." });
        }
      }

      const updateData = { status };
      if (notes) updateData.notes = notes;
      if (status === 'fulfilled') updateData.fulfilledAt = new Date();

      const request = await Request.findByIdAndUpdate(requestId, updateData, { new: true })
        .populate('requesterId', 'username firstName lastName role');
  
      // If approved/delivered, deduct from inventory
      if (status === "delivered" || status === "approved") {
        const item = await InventoryItem.findOne({ name: request.itemName });
        if (item && item.currentStock >= request.quantity) {
          item.currentStock -= request.quantity;
          await item.save();
        }
      }
  
      res.json({ message: "Request status updated.", request });
    } catch (err) {
      console.error("❌ Admin Request Update Error:", err.message);
      res.status(500).json({ error: "Failed to update request status." });
    }
  });

  // Delete request (admin only)
  app.delete("/api/admin/request/:id", protect, authorize('Super Admin', 'Admin'), async (req, res) => {
    try {
      const request = await Request.findByIdAndDelete(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found." });
      }
      res.json({ message: "Request deleted successfully." });
    } catch (err) {
      console.error("❌ Delete Request Error:", err.message);
      res.status(500).json({ error: "Failed to delete request." });
    }
  });
    

// **********************************************
// ********* PUBLIC EMERGENCY ENDPOINT **********
// **********************************************
// Public emergency request (no authentication required for testing)
app.post("/api/emergency/public-request", async (req, res) => {
  try {
    const { lat, lon, message, address } = req.body;

    // Validate input
    if (!lat || !lon || !message) {
      return res.status(400).json({
        error: 'Missing required fields: lat, lon, message'
      });
    }

    console.log(`🚨 Public emergency request at ${lat}, ${lon}`);
    console.log(`📝 Message: "${message}"`);

    // Simple response for testing (without full AI processing)
    const emergencyId = `EMG_${Date.now()}`;
    
    res.status(201).json({
      success: true,
      emergencyId,
      message: "Public emergency request received successfully!",
      location: { lat, lon, address },
      userMessage: message,
      status: "received",
      note: "This is a test endpoint. Full AI processing available with authentication."
    });

  } catch (error) {
    console.error('❌ Public emergency request error:', error.message);
    res.status(500).json({
      error: 'Failed to process emergency request',
      details: error.message
    });
  }
});

// **********************************************
// ********* EMERGENCY AI AGENT ROUTES **********
// **********************************************
app.use('/api/emergency', protect, emergencyRoutes);

// **********************************************
// ********* AI AGENTS CRUD ROUTES **************
// **********************************************
app.use('/api/agents', protect, agentsRoutes);

// **********************************************
// ********* INVENTORY & DONATIONS ROUTES *******
// **********************************************
app.use('/api/inventory', inventoryRoutes);
app.use('/api', inventoryRoutes); // For /api/donations and /api/requests

// **********************************************
// ********* LIVE DISASTERS ROUTES **************
// **********************************************
app.use('/api/disasters', disastersRoutes);

// **********************************************
// ********* DATA MANAGEMENT ROUTES *************
// **********************************************
app.use('/api/data', dataManagementRoutes);

// **********************************************
// ********* DISASTER PREDICTIONS API ***********
// **********************************************
// Public endpoint - accessible to everyone (no authentication required)
app.get("/api/disaster-predictions", async (req, res) => {
  console.log("📈 /api/disaster-predictions endpoint hit");
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.warn("⚠️ Disaster prediction CSV file not found, returning empty dataset");
      return res.json({
        message: "Disaster prediction data not available",
        data: [],
        timestamp: new Date().toISOString()
      });
    }

    const jsonArray = await csv().fromFile(CSV_FILE_PATH);

    const disasterData = jsonArray
      .map(row => {
        const prediction_data = {};
        const predicted_labels = [];
        const lat = parseFloat(row.lat);
        const lon = parseFloat(row.lon);
        let isDisasterPredicted = false;

        if (isNaN(lat) || isNaN(lon)) return null;

        for (const key in row) {
          if (['lat', 'lon', 'image_path', 'row'].includes(key)) continue;
          const prob = parseFloat(row[key]);
          if (!isNaN(prob)) {
            prediction_data[key] = prob;
            if (prob >= THRESHOLD && !PRESENCE_KEYS.includes(key)) {
              predicted_labels.push(key);
              isDisasterPredicted = true;
            }
          }
        }

        return isDisasterPredicted
          ? {
              latitude: lat,
              longitude: lon,
              timestamp: new Date().toISOString(),
              predicted_labels,
              prediction_data,
            }
          : null;
      })
      .filter(Boolean);

    console.log(`📦 Returning ${disasterData.length} records.`);
    res.json(disasterData);
  } catch (err) {
    console.error("❌ Error processing predictions:", err.message);
    res.status(500).json({ error: "Failed to process disaster prediction data." });
  }
});

// **********************************************
// ************* SERVE FRONTEND *****************
// **********************************************
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

// **********************************************
// ********* ADMIN UTILITY ROUTES ***************
// **********************************************

// **********************************************
// ************ CONNECT & START *****************
// **********************************************
connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("❌ Failed to connect to DB:", err.message);
    process.exit(1);
  });
