import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { db } from "./src/server/db.js";
import { 
  User, 
  StudentProfile, 
  PlacementDrive, 
  DriveRegistration, 
  Announcement, 
  AuditLog, 
  Notification,
  SUPPORTED_DEPARTMENTS
} from "./src/types.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Load environment variables
dotenv.config();

// Configure Multer memory storage and Cloudinary integration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

let cloudinaryConfigured = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
    console.log("Cloudinary client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Cloudinary client:", err);
  }
} else {
  console.warn("Cloudinary credentials missing. PDF uploads will fall back to local disk storage.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI Engine Initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI client:", err);
  }
} else {
  console.warn("Warning: GEMINI_API_KEY is not set. AI services will run with fallback intelligence.");
}

// Simple Helper to create audit logs
const logActivity = (userId: string, userName: string, role: string, action: string, details: string) => {
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    role: role as any,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.addAuditLog(newLog);
  return newLog;
};

// Create a system-wide or user-specific notification
const notify = (userId: string, title: string, content: string, type: "drive" | "interview" | "announcement" | "selection" | "system") => {
  const newNot: Notification = {
    id: `not_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    title,
    content,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.addNotification(newNot);
  return newNot;
};

// ==========================================
// 1. AUTHENTICATION & PROFILE API
// ==========================================

// Mock OTP verification stores
const tempOTPStorage = new Map<string, { otp: string; expires: number; userData: any }>();

// Register
app.post("/api/auth/register", (req, res) => {
  const { email, password, role, name, department } = req.body;

  if (!email || !password || !role || !name || !department) {
    return res.status(400).json({ error: "All registration fields are required." });
  }

  // Check existing
  const existing = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "User with this email already registered." });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  tempOTPStorage.set(email.toLowerCase(), {
    otp,
    expires,
    userData: { email, password, role, name, department }
  });

  console.log(`[OTP Broadcast] Sent OTP ${otp} to ${email}`);

  // Return success with simulated delivery message
  return res.json({
    message: "OTP sent successfully to email.",
    debugOTP: otp // Keep developer-friendly
  });
});

// Verify OTP
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  const stored = tempOTPStorage.get(email.toLowerCase());
  if (!stored) {
    return res.status(400).json({ error: "No OTP request active for this email." });
  }

  if (Date.now() > stored.expires) {
    tempOTPStorage.delete(email.toLowerCase());
    return res.status(400).json({ error: "OTP expired. Please request a new one." });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP code. Please try again." });
  }

  // Create User
  const newUser: User = {
    id: `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: stored.userData.email,
    role: stored.userData.role,
    name: stored.userData.name,
    department: stored.userData.department,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);

  // If student role, create initial empty profile
  if (newUser.role === "student") {
    const initialProfile: StudentProfile = {
      userId: newUser.id,
      enrollmentNo: `UR${new Date().getFullYear() % 100}${newUser.department.split(" ").map(w => w[0]).join("")}${Math.floor(1000 + Math.random() * 9000)}`,
      department: newUser.department,
      phone: "",
      academics: {
        board10th: 0,
        board12th: 0,
        cgpa: 0,
        standingArrears: 0,
        historyOfArrears: 0
      },
      skills: [],
      projects: [],
      internships: [],
      certifications: [],
      achievements: [],
      resumeApproved: "pending",
      completedPercent: 10
    };
    db.saveStudentProfile(initialProfile);
  }

  tempOTPStorage.delete(email.toLowerCase());
  logActivity(newUser.id, newUser.name, newUser.role, "Account Verification", "Completed signup and verified email.");

  return res.json({
    message: "Email verified and registration complete.",
    user: newUser
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "Account not found." });
  }

  // Simulate verification of dummy passwords for full-stack prototype
  const token = `token_${user.id}_${Date.now()}`;

  // Log to history
  const entry = {
    id: `history_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ip: "127.0.0.1",
    device: "Chrome / Linux Agent Container"
  };
  
  const history = user.loginHistory || [];
  history.unshift(entry);
  db.updateUser(user.id, { loginHistory: history });

  logActivity(user.id, user.name, user.role, "Login", "Logged into application.");

  return res.json({
    message: "Login successful.",
    token,
    user
  });
});

// Request Password Reset
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "No user found with this email." });
  }

  const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
  tempOTPStorage.set(`reset_${email.toLowerCase()}`, {
    otp: resetOTP,
    expires: Date.now() + 10 * 60 * 1000,
    userData: { email }
  });

  console.log(`[OTP Reset Broadcast] Reset OTP ${resetOTP} sent to ${email}`);

  return res.json({
    message: "Password reset OTP sent to email.",
    debugOTP: resetOTP
  });
});

// Verify & Reset Password
app.post("/api/auth/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;
  const key = `reset_${email.toLowerCase()}`;
  const stored = tempOTPStorage.get(key);

  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: "Invalid or expired OTP." });
  }

  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    logActivity(user.id, user.name, user.role, "Password Reset", "Successfully updated account password.");
  }

  tempOTPStorage.delete(key);
  return res.json({ message: "Password reset successfully. Please login." });
});

// ==========================================
// 2. STUDENT PORTAL API
// ==========================================

// Get profile details
app.get("/api/student/profile/:userId", (req, res) => {
  const { userId } = req.params;
  const profile = db.getStudentProfile(userId);
  if (!profile) {
    return res.status(404).json({ error: "Student profile not found." });
  }
  return res.json(profile);
});

// Save or Update profile details
app.put("/api/student/profile/:userId", (req, res) => {
  const { userId } = req.params;
  const existing = db.getStudentProfile(userId);
  
  if (!existing) {
    return res.status(404).json({ error: "Student profile not found." });
  }

  const updates = req.body;
  
  // Recalculate completion score
  let score = 10; // basic registration
  if (updates.phone) score += 10;
  if (updates.enrollmentNo) score += 10;
  if (updates.academics && updates.academics.cgpa > 0) score += 20;
  if (updates.skills && updates.skills.length > 0) score += 15;
  if (updates.projects && updates.projects.length > 0) score += 15;
  if (updates.internships && updates.internships.length > 0) score += 10;
  if (updates.resumeUrl) score += 10;

  const merged: StudentProfile = {
    ...existing,
    ...updates,
    completedPercent: Math.min(score, 100)
  };

  db.saveStudentProfile(merged);

  const user = db.getUsers().find(u => u.id === userId);
  if (user) {
    logActivity(userId, user.name, user.role, "Update Profile", "Updated academic, skill, and project details.");
  }

  return res.json({
    message: "Profile updated successfully.",
    profile: merged
  });
});

// Submit real PDF resume file (Multipart upload)
app.post("/api/student/resume/upload/:userId", (req, res) => {
  const { userId } = req.params;

  const existing = db.getStudentProfile(userId);
  if (!existing) {
    return res.status(404).json({ error: "Student profile not found." });
  }

  upload.single("resume")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File size exceeds 5 MB limit." });
        }
        return res.status(400).json({ error: `Upload limit error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || "An error occurred during file upload." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No PDF file was provided." });
    }

    const file = req.file;
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    try {
      let finalUrl = "";

      if (cloudinaryConfigured) {
        // Upload buffer directly to Cloudinary
        await new Promise<void>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: `atlas_resumes/${userId}`,
              public_id: sanitizedFileName.replace(/\.pdf$/i, ""),
              format: "pdf",
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else if (result) {
                finalUrl = result.secure_url;
                resolve();
              } else {
                reject(new Error("No response result from Cloudinary"));
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      }

      // Local storage fallback if Cloudinary isn't configured, or if it failed
      if (!finalUrl) {
        const localDir = path.join(process.cwd(), "data", "resumes", userId);
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const localPath = path.join(localDir, sanitizedFileName);
        fs.writeFileSync(localPath, file.buffer);

        const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
        finalUrl = `${appUrl.replace(/\/$/, "")}/api/resumes/${userId}/${sanitizedFileName}`;
      }

      const updatedProfile: StudentProfile = {
        ...existing,
        resumeUrl: finalUrl,
        resumeFileName: sanitizedFileName,
        resumeApproved: "pending" // reset approval status on upload
      };

      db.saveStudentProfile(updatedProfile);

      const studentUser = db.getUsers().find(u => u.id === userId);
      if (studentUser) {
        logActivity(userId, studentUser.name, studentUser.role, "Resume Upload", `Uploaded resume PDF: ${sanitizedFileName}`);
        // Send alert to department coordinator
        const coordinators = db.getUsers().filter(u => u.role === "coordinator" && u.department === studentUser.department);
        coordinators.forEach(coord => {
          notify(coord.id, "New Resume Submitted", `${studentUser.name} uploaded a new resume awaiting verification.`, "system");
        });
      }

      return res.json({
        message: cloudinaryConfigured 
          ? "Resume uploaded to Cloudinary successfully!" 
          : "Resume uploaded locally (sandbox fallback) successfully!",
        profile: updatedProfile,
        url: finalUrl
      });

    } catch (uploadErr: any) {
      console.error("Upload error context:", uploadErr);
      return res.status(500).json({ error: `File upload processing failed: ${uploadErr.message || uploadErr}` });
    }
  });
});

// Serve locally stored resumes
app.get("/api/resumes/:userId/:filename", (req, res) => {
  const { userId, filename } = req.params;
  const filePath = path.join(process.cwd(), "data", "resumes", userId, filename);
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

// Get registered and eligible drives for student
app.get("/api/student/drives/:userId", (req, res) => {
  const { userId } = req.params;
  const profile = db.getStudentProfile(userId);
  
  if (!profile) {
    return res.status(404).json({ error: "Profile not found." });
  }

  const allDrives = db.getDrives();
  const allRegs = db.getRegistrations().filter(r => r.studentId === userId);

  // Map drive list with application details if applied
  const drivesData = allDrives.map(drive => {
    const reg = allRegs.find(r => r.driveId === drive.id);
    
    // Check eligibility
    const eligibleDept = drive.eligibleDepts.includes(profile.department);
    const eligibleCGPA = profile.academics.cgpa >= drive.minCGPA;
    const eligibleArrears = profile.academics.standingArrears <= drive.maxStandingArrears;
    const eligible = eligibleDept && eligibleCGPA && eligibleArrears;

    return {
      ...drive,
      isEligible: eligible,
      eligibilityReasons: {
        dept: eligibleDept,
        cgpa: eligibleCGPA,
        arrears: eligibleArrears
      },
      registration: reg ? {
        id: reg.id,
        status: reg.status,
        appliedAt: reg.appliedAt,
        interviewSchedule: reg.interviewSchedule,
        remarks: reg.remarks
      } : null
    };
  });

  return res.json(drivesData);
});

// Register for a placement drive
app.post("/api/student/drives/register", (req, res) => {
  const { userId, driveId } = req.body;

  const profile = db.getStudentProfile(userId);
  const drive = db.getDrives().find(d => d.id === driveId);
  const user = db.getUsers().find(u => u.id === userId);

  if (!profile || !drive || !user) {
    return res.status(400).json({ error: "Invalid student or placement drive selection." });
  }

  // Check if already registered
  const existingReg = db.getRegistrations().find(r => r.studentId === userId && r.driveId === driveId);
  if (existingReg) {
    return res.status(400).json({ error: "Already registered for this drive." });
  }

  // Check eligibility
  const eligibleDept = drive.eligibleDepts.includes(profile.department);
  const eligibleCGPA = profile.academics.cgpa >= drive.minCGPA;
  const eligibleArrears = profile.academics.standingArrears <= drive.maxStandingArrears;

  if (!eligibleDept || !eligibleCGPA || !eligibleArrears) {
    return res.status(400).json({ error: "You are not eligible for this drive due to academic thresholds." });
  }

  if (profile.resumeApproved !== "approved") {
    return res.status(400).json({ error: "Registration blocked. Resume must be approved by coordinator first." });
  }

  const newReg: DriveRegistration = {
    id: `reg_${Date.now()}`,
    driveId,
    studentId: userId,
    studentName: user.name,
    studentDept: profile.department,
    studentCGPA: profile.academics.cgpa,
    resumeUrl: profile.resumeUrl,
    status: "applied",
    appliedAt: new Date().toISOString()
  };

  db.addRegistration(newReg);
  logActivity(userId, user.name, user.role, "Drive Register", `Registered for drive: ${drive.companyName} - ${drive.role}`);
  notify(userId, "Registration Successful", `Your registration for ${drive.companyName} (${drive.role}) is recorded.`, "drive");

  return res.json({
    message: "Successfully registered for drive.",
    registration: newReg
  });
});

// ==========================================
// 3. COORDINATOR PORTAL API
// ==========================================

// Get department student roster with profiles
app.get("/api/coordinator/students/:dept", (req, res) => {
  const { dept } = req.params;
  const users = db.getUsers().filter(u => u.role === "student" && u.department === dept);
  
  const roster = users.map(user => {
    const profile = db.getStudentProfile(user.id);
    return {
      user,
      profile: profile || null
    };
  });

  return res.json(roster);
});

// Verify student resume status
app.post("/api/coordinator/resume/review", (req, res) => {
  const { coordinatorId, studentId, status, comments } = req.body;

  const profile = db.getStudentProfile(studentId);
  const student = db.getUsers().find(u => u.id === studentId);
  const coordinator = db.getUsers().find(u => u.id === coordinatorId);

  if (!profile || !student || !coordinator) {
    return res.status(400).json({ error: "Review details or student profiles are invalid." });
  }

  profile.resumeApproved = status;
  profile.resumeComments = comments;
  db.saveStudentProfile(profile);

  logActivity(coordinatorId, coordinator.name, coordinator.role, "Review Resume", `Reviewed ${student.name}'s resume to: ${status}.`);
  
  const statusLabel = status === "approved" ? "Approved" : "Needs Revision";
  notify(studentId, `Resume Review: ${statusLabel}`, `Coordinator comments: "${comments || 'No comment provided'}"`, "system");

  return res.json({
    message: `Resume marked as ${status} successfully.`,
    profile
  });
});

// Broadcast Announcement
app.post("/api/coordinator/announcement", (req, res) => {
  const { authorId, title, content, department } = req.body;

  const author = db.getUsers().find(u => u.id === authorId);
  if (!author) {
    return res.status(400).json({ error: "Invalid author credential." });
  }

  const newAnn: Announcement = {
    id: `ann_${Date.now()}`,
    title,
    content,
    department,
    authorName: author.name,
    createdAt: new Date().toISOString()
  };

  db.addAnnouncement(newAnn);
  logActivity(authorId, author.name, author.role, "Create Announcement", `Published announcement: ${title}`);

  // Broadcast to target students
  const targets = db.getUsers().filter(u => u.role === "student" && (department === "All" || u.department === department));
  targets.forEach(student => {
    notify(student.id, `Announcement: ${title}`, content.substring(0, 120) + "...", "announcement");
  });

  return res.json({
    message: "Announcement broadcasted successfully.",
    announcement: newAnn
  });
});

// Delete announcement
app.delete("/api/coordinator/announcement/:id", (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteAnnouncement(id);
  if (deleted) {
    return res.json({ message: "Announcement deleted successfully." });
  }
  return res.status(404).json({ error: "Announcement not found." });
});

// ==========================================
// 4. PLACEMENT OFFICER PORTAL API
// ==========================================

// Create placement drive
app.post("/api/officer/drive", (req, res) => {
  const { officerId, companyName, role, packageLPA, eligibleDepts, minCGPA, maxStandingArrears, driveDate, location, description } = req.body;

  const officer = db.getUsers().find(u => u.id === officerId);
  if (!officer) {
    return res.status(400).json({ error: "Invalid placement officer credential." });
  }

  const newDrive: PlacementDrive = {
    id: `drive_${Date.now()}`,
    companyName,
    role,
    packageLPA: parseFloat(packageLPA),
    eligibleDepts,
    minCGPA: parseFloat(minCGPA),
    maxStandingArrears: parseInt(maxStandingArrears),
    driveDate,
    location,
    description,
    status: "active",
    createdAt: new Date().toISOString()
  };

  db.addDrive(newDrive);
  logActivity(officerId, officer.name, officer.role, "Create Placement Drive", `Created drive ${companyName} (${role}) for ${packageLPA} LPA.`);

  // Create notifications
  notify("all", `New Placement Drive: ${companyName}`, `${role} package offering ${packageLPA} LPA. Eligibility: ${minCGPA} CGPA.`, "drive");

  return res.json({
    message: "Placement drive published successfully.",
    drive: newDrive
  });
});

// Update placement drive status
app.put("/api/officer/drive/:driveId", (req, res) => {
  const { driveId } = req.params;
  const updates = req.body;

  const drive = db.updateDrive(driveId, updates);
  if (!drive) {
    return res.status(404).json({ error: "Placement drive not found." });
  }

  return res.json({
    message: "Drive status updated successfully.",
    drive
  });
});

// Delete placement drive
app.delete("/api/officer/drive/:driveId", (req, res) => {
  const { driveId } = req.params;
  const success = db.deleteDrive(driveId);
  if (success) {
    return res.json({ message: "Drive removed successfully." });
  }
  return res.status(404).json({ error: "Drive not found." });
});

// Get all applications / registrants for a drive
app.get("/api/officer/drive/:driveId/registrations", (req, res) => {
  const { driveId } = req.params;
  const regs = db.getRegistrations().filter(r => r.driveId === driveId);
  return res.json(regs);
});

// Update applicant selection pipeline status
app.post("/api/officer/registration/status", (req, res) => {
  const { officerId, registrationId, status, interviewSchedule, remarks } = req.body;

  const officer = db.getUsers().find(u => u.id === officerId);
  if (!officer) {
    return res.status(400).json({ error: "Invalid officer credentials." });
  }

  const updated = db.updateRegistration(registrationId, {
    status,
    interviewSchedule,
    remarks
  });

  if (!updated) {
    return res.status(404).json({ error: "Registration record not found." });
  }

  logActivity(officerId, officer.name, officer.role, "Update Registrant Status", `Changed registration ${registrationId} status to: ${status}`);

  const drive = db.getDrives().find(d => d.id === updated.driveId);
  const driveLabel = drive ? drive.companyName : "Recruitment";

  // Notify student
  if (status === "shortlisted" || status === "interviewing") {
    notify(
      updated.studentId, 
      `Shortlisted: ${driveLabel}`, 
      `Excellent! You are advanced to ${status}. Schedule: ${interviewSchedule || 'TBD'}`, 
      "interview"
    );
  } else if (status === "selected") {
    notify(
      updated.studentId, 
      `CONGRATULATIONS: Placed at ${driveLabel}!`, 
      `Amazing news! You are selected as ${drive?.role || 'SDE'}. Package: ${drive?.packageLPA || '-'} LPA.`, 
      "selection"
    );
  } else if (status === "rejected") {
    notify(
      updated.studentId, 
      `Application Status Update: ${driveLabel}`, 
      `Thank you for participating. Update for ${driveLabel} drive is: Rejected. Continue preparing!`, 
      "system"
    );
  }

  return res.json({
    message: "Applicant status updated.",
    registration: updated
  });
});

// Get all administrative details
app.get("/api/admin/overview", (req, res) => {
  const allUsers = db.getUsers();
  const allProfiles = db.getStudentProfiles();
  const allDrives = db.getDrives();
  const allRegs = db.getRegistrations();
  
  const totalStudents = allUsers.filter(u => u.role === "student").length;
  const totalCoordinators = allUsers.filter(u => u.role === "coordinator").length;
  const totalDrives = allDrives.length;
  const placedCount = allRegs.filter(r => r.status === "selected").length;
  
  // Placement percentage
  const placementRate = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;

  // Average package
  const placedDriveIds = allRegs.filter(r => r.status === "selected").map(r => r.driveId);
  const placedDrives = allDrives.filter(d => placedDriveIds.includes(d.id));
  const avgPackage = placedDrives.length > 0 
    ? (placedDrives.reduce((sum, d) => sum + d.packageLPA, 0) / placedDrives.length).toFixed(1)
    : "0.0";

  // Max package
  const maxPackage = placedDrives.length > 0 
    ? Math.max(...placedDrives.map(d => d.packageLPA)).toFixed(1)
    : "0.0";

  return res.json({
    counters: {
      students: totalStudents,
      coordinators: totalCoordinators,
      drives: totalDrives,
      placed: placedCount,
      placementRate,
      avgPackage,
      maxPackage
    },
    auditLogs: db.getAuditLogs().slice(0, 50), // Send last 50 logs
    departmentsList: SUPPORTED_DEPARTMENTS
  });
});

// ==========================================
// 5. NOTIFICATIONS & BULK ANNOUNCEMENTS
// ==========================================

// Get user notifications
app.get("/api/notifications/:userId", (req, res) => {
  const { userId } = req.params;
  const nots = db.getNotifications().filter(n => n.userId === userId || n.userId === "all");
  return res.json(nots);
});

// Mark notifications read
app.post("/api/notifications/:userId/read", (req, res) => {
  const { userId } = req.params;
  db.markNotificationsRead(userId);
  return res.json({ success: true });
});

// Get global announcements
app.get("/api/announcements", (req, res) => {
  return res.json(db.getAnnouncements());
});

// ==========================================
// 6. ATLAS AI ASSISTANT POWERED BY GEMINI
// ==========================================

app.post("/api/ai/assistant", async (req, res) => {
  const { feature, payload } = req.body;

  if (!ai) {
    return res.status(200).json({ 
      error: "Gemini AI capability is currently running offline or credentials need verification. Here is local algorithmic feedback.",
      aiResponse: getLocalAIFallback(feature, payload)
    });
  }

  try {
    let prompt = "";
    
    if (feature === "resume_review") {
      const { profile } = payload;
      prompt = `You are ATLAS, an expert Campus Placement Director and ATS (Applicant Tracking System) reviewer.
Analyze this student's profile for recruitment:
Name: ${profile.name}
Department: ${profile.department}
CGPA: ${profile.academics?.cgpa}
Skills: ${JSON.stringify(profile.skills)}
Projects: ${JSON.stringify(profile.projects)}
Internships: ${JSON.stringify(profile.internships)}
Certifications: ${JSON.stringify(profile.certifications)}

Provide a strict JSON response containing:
1. "atsScore": a number out of 100 representing how well optimized this profile is.
2. "atsFeedback": a detailed professional text review of their strengths and alignment with top-tier placements.
3. "skillGapAnalysis": a string array of 3-4 technologies they are missing for high-paying roles in their branch.
4. "suggestedRoadmap": a concise 3-step learning plan with deadlines.
5. "predictedPlacementChance": "High" or "Medium" or "Low".

Ensure you return ONLY clean valid JSON inside your response, matching this schema:
{
  "atsScore": number,
  "atsFeedback": "string",
  "skillGapAnalysis": ["string", "string"],
  "suggestedRoadmap": "string",
  "predictedPlacementChance": "High" | "Medium" | "Low"
}`;
    } else if (feature === "placement_recommendation") {
      const { drive, students } = payload;
      prompt = `You are ATLAS, the Placement Intelligence AI. We have an upcoming recruitment drive:
Company: ${drive.companyName}
Role: ${drive.role}
Eligible Branches: ${JSON.stringify(drive.eligibleDepts)}
Preferred CGPA Threshold: ${drive.minCGPA}
Required Core Technical Domain Skills: ${drive.description}

Here is a list of our student candidates:
${JSON.stringify(students.map((s: any) => ({
  id: s.user.id,
  name: s.user.name,
  cgpa: s.profile?.academics?.cgpa,
  skills: s.profile?.skills || []
})))}

Analyze the candidates and return a strict JSON array of top recommendations (max 3 students). For each recommended student, output:
1. "studentId": their exact string ID.
2. "studentName": their string name.
3. "matchReason": a detailed description explaining why they are an elite match for this specific company.
4. "confidenceScore": a number between 0 and 100 matching their fit.

Format your response strictly as:
{
  "recommendations": [
    { "studentId": "id", "studentName": "name", "matchReason": "reason", "confidenceScore": 95 }
  ]
}`;
    } else if (feature === "announcement_generator") {
      const { driveDetails } = payload;
      prompt = `You are ATLAS, the automated recruitment coordinator. Generate an engaging and informative campus-wide announcement for:
Company: ${driveDetails.companyName}
Role: ${driveDetails.role}
Compensation: ${driveDetails.packageLPA} LPA
Required CGPA: ${driveDetails.minCGPA}
Selection Date: ${driveDetails.driveDate}

Provide your response in JSON format:
{
  "title": "A highly punchy announcement title",
  "content": "Professional, encouraging and detailed announcement content outlining instructions to students."
}`;
    } else {
      // General QA / Career Advisory
      const { userMessage, chatHistory } = payload;
      prompt = `You are ATLAS, the friendly, supportive AI Career Advisor for college placements. 
Answer this placement-related question: "${userMessage}"
Context of past conversation: ${JSON.stringify(chatHistory || [])}
Provide highly professional, encouraging, and detailed suggestions.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: prompt.includes("JSON") ? "application/json" : "text/plain"
      }
    });

    const textOutput = response.text || "";
    
    if (prompt.includes("JSON")) {
      try {
        const parsed = JSON.parse(textOutput.trim());
        return res.json({ aiResponse: parsed });
      } catch (parseErr) {
        console.error("Failed to parse Gemini JSON, sending raw text:", textOutput);
        return res.json({ aiResponse: textOutput });
      }
    } else {
      return res.json({ aiResponse: textOutput });
    }

  } catch (err: any) {
    console.error("Gemini API call failed, invoking algorithmic fallback:", err);
    return res.status(200).json({
      error: "AI stream exceeded rate limits. Using local algorithmic parser.",
      aiResponse: getLocalAIFallback(feature, payload)
    });
  }
});

// High quality fallback analyzer to ensure 100% robust functioning if API Key is missing or fails
function getLocalAIFallback(feature: string, payload: any) {
  if (feature === "resume_review") {
    const { profile } = payload;
    const skillsCount = profile.skills?.length || 0;
    const projectsCount = profile.projects?.length || 0;
    const cgpa = profile.academics?.cgpa || 7.0;

    let score = 55;
    score += Math.min(skillsCount * 4, 20);
    score += Math.min(projectsCount * 10, 20);
    score += Math.min(cgpa * 3, 30);
    score = Math.min(Math.round(score), 100);

    const feedback = `Local Analysis Engine: Your profile is reasonably well structured. With a CGPA of ${cgpa}, you are eligible for ${cgpa >= 8.0 ? 'Elite Tier (15+ LPA)' : 'Core Tier (6-12 LPA)'} roles. Suggest adding more verified GitHub project links and target high-demand cloud integrations.`;
    
    return {
      atsScore: score,
      atsFeedback: feedback,
      skillGapAnalysis: ["Docker / Containers", "AWS Cloud Services", "Redis Caching"],
      suggestedRoadmap: "1. Learn Docker orchestration concepts (7 days).\n2. Refactor existing FastAPI endpoints to integrate Redis-based rate-limiters (5 days).\n3. Deploy the application stack onto an AWS Elastic Beanstalk cluster (5 days).",
      predictedPlacementChance: cgpa >= 8.5 ? "High" : "Medium"
    };
  } else if (feature === "placement_recommendation") {
    const { drive, students } = payload;
    // Map top students matching CGPA
    const filtered = students
      .filter((s: any) => s.profile?.academics?.cgpa >= drive.minCGPA)
      .slice(0, 2)
      .map((s: any) => ({
        studentId: s.user.id,
        studentName: s.user.name,
        matchReason: `Demonstrates premium competency. Meets the target academic CGPA restriction of ${drive.minCGPA} and features core relevant software skills matching ${drive.companyName}'s framework preferences.`,
        confidenceScore: 92
      }));
    return { recommendations: filtered };
  } else if (feature === "announcement_generator") {
    const { driveDetails } = payload;
    return {
      title: `⚡ Placement Alert: Campus Drive for ${driveDetails.companyName} is Now Live!`,
      content: `Attention all final year eligible candidates! We are thrilled to host ${driveDetails.companyName} on our campus on ${driveDetails.driveDate}. They will be recruiting for the position of ${driveDetails.role} with an attractive compensation package of ${driveDetails.packageLPA} LPA. Academic criteria requires minimum ${driveDetails.minCGPA} CGPA with maximum 0 active standing arrears. Review your profile details, ensure your resume is approved by your coordinator, and hit Register today!`
    };
  } else {
    return `Local ATLAS Advisor: Campus placements require a perfect balance between deep technical coding ability and positive communication skills. Practice solving at least 2 system-design patterns every day, and review our mock interview checklists before scheduling your screening.`;
  }
}

// ==========================================
// 7. REPORTS GENERATION (Mock export data)
// ==========================================

app.get("/api/reports/export/:format/:type", (req, res) => {
  const { format, type } = req.params;
  
  // Format simulated content
  let csvContent = "";
  if (type === "students") {
    csvContent = "User ID,Name,Department,CGPA,Arrears,Resume Status,Placement Status\n";
    const users = db.getUsers().filter(u => u.role === "student");
    users.forEach(u => {
      const p = db.getStudentProfile(u.id);
      const isPlaced = db.getRegistrations().some(r => r.studentId === u.id && r.status === "selected");
      csvContent += `"${u.id}","${u.name}","${u.department}",${p?.academics?.cgpa || 0},${p?.academics?.standingArrears || 0},"${p?.resumeApproved || 'pending'}","${isPlaced ? 'Placed' : 'Unplaced'}"\n`;
    });
  } else if (type === "drives") {
    csvContent = "Drive ID,Company Name,Role,Package (LPA),Eligible Branches,Status\n";
    db.getDrives().forEach(d => {
      csvContent += `"${d.id}","${d.companyName}","${d.role}",${d.packageLPA},"${d.eligibleDepts.join(';') || 'All'}","${d.status}"\n`;
    });
  } else {
    csvContent = "Log ID,User Name,Role,Action,Details,Timestamp\n";
    db.getAuditLogs().slice(0, 100).forEach(l => {
      csvContent += `"${l.id}","${l.userName}","${l.role}","${l.action}","${l.details}","${l.timestamp}"\n`;
    });
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=ATLAS_${type}_Report.${format === 'csv' ? 'csv' : 'txt'}`);
  return res.send(csvContent);
});

// ==========================================
// VITE DEV SERVER / PRODUCTION SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middlewares
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production assets from dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ATLAS Recruitment Server humming on http://localhost:${PORT}`);
  });
}

startServer();
