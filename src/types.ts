/**
 * ATLAS - AI-Driven Placement Coordinator System
 * Shared Type Definitions
 */

export type UserRole = "student" | "coordinator" | "officer";

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  department: string;
  isVerified: boolean;
  otp?: string;
  createdAt: string;
  loginHistory?: LoginHistoryEntry[];
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ip: string;
  device: string;
}

export interface AcademicDetails {
  board10th: number; // Percent
  board12th: number; // Percent
  diploma?: number;  // Optional Percent
  cgpa: number;
  standingArrears: number;
  historyOfArrears: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link?: string;
}

export interface Internship {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface StudentProfile {
  userId: string;
  enrollmentNo: string;
  department: string;
  phone: string;
  academics: AcademicDetails;
  skills: string[];
  projects: Project[];
  internships: Internship[];
  certifications: Certification[];
  achievements: string[];
  resumeUrl?: string;
  resumeFileName?: string;
  resumeApproved: "pending" | "approved" | "rejected";
  resumeComments?: string;
  atsScore?: number;
  atsFeedback?: string;
  skillGapAnalysis?: string[];
  suggestedRoadmap?: string;
  predictedPlacementChance?: "High" | "Medium" | "Low";
  completedPercent: number;
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  role: string;
  packageLPA: number;
  eligibleDepts: string[];
  minCGPA: number;
  maxStandingArrears: number;
  driveDate: string;
  location: string;
  description: string;
  status: "upcoming" | "active" | "completed";
  createdAt: string;
}

export interface DriveRegistration {
  id: string;
  driveId: string;
  studentId: string;
  studentName: string;
  studentDept: string;
  studentCGPA: number;
  resumeUrl?: string;
  status: "applied" | "shortlisted" | "interviewing" | "selected" | "rejected";
  appliedAt: string;
  interviewSchedule?: string; // Date time string or description
  remarks?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  department: string; // "All" or specific department
  authorName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string; // "all" or specific userId
  title: string;
  content: string;
  type: "drive" | "interview" | "announcement" | "selection" | "system";
  isRead: boolean;
  createdAt: string;
}

// Supported Departments List
export const SUPPORTED_DEPARTMENTS = [
  "Artificial Intelligence and Data Science",
  "Artificial Intelligence and Machine Learning",
  "Computer Science Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Computer and Communication Engineering",
  "Computer Science and Business Systems",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biomedical Engineering",
  "Biotechnology",
  "Fashion Technology"
] as const;
