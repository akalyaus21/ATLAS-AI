import fs from "fs";
import path from "path";
import { 
  User, 
  StudentProfile, 
  PlacementDrive, 
  DriveRegistration, 
  Announcement, 
  AuditLog, 
  Notification,
  SUPPORTED_DEPARTMENTS
} from "../types.js";

// Database storage path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DBState {
  users: User[];
  studentProfiles: StudentProfile[];
  drives: PlacementDrive[];
  registrations: DriveRegistration[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

// Initial Seed Data
const getSeedData = (): DBState => {
  // Pre-seed some default users
  const users: User[] = [
    {
      id: "officer_1",
      email: "placement@college.edu",
      role: "officer",
      name: "Dr. Aris Kumar (Director of Placement)",
      department: "All",
      isVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "coord_cse",
      email: "coordinator.cse@college.edu",
      role: "coordinator",
      name: "Prof. Rajesh Dev",
      department: "Computer Science Engineering",
      isVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "coord_aids",
      email: "coordinator.aids@college.edu",
      role: "coordinator",
      name: "Dr. Shalini Sen",
      department: "Artificial Intelligence and Data Science",
      isVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "student_akalya",
      email: "akalyaus@gmail.com", // Personalized for user
      role: "student",
      name: "Akalya S",
      department: "Artificial Intelligence and Data Science",
      isVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "student_2",
      email: "student2@college.edu",
      role: "student",
      name: "Rahul Verma",
      department: "Computer Science Engineering",
      isVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "student_3",
      email: "student3@college.edu",
      role: "student",
      name: "Sneha Nair",
      department: "Computer Science Engineering",
      isVerified: true,
      createdAt: new Date().toISOString()
    }
  ];

  const studentProfiles: StudentProfile[] = [
    {
      userId: "student_akalya",
      enrollmentNo: "UR22AIDS1042",
      department: "Artificial Intelligence and Data Science",
      phone: "+91 98402 12345",
      academics: {
        board10th: 94.5,
        board12th: 92.8,
        cgpa: 9.35,
        standingArrears: 0,
        historyOfArrears: 0
      },
      skills: ["Python", "TensorFlow", "React", "TypeScript", "SQL", "Scikit-Learn", "FastAPI"],
      projects: [
        {
          id: "p_1",
          title: "ATLAS Placement Analytics",
          description: "An AI-powered dashboard leveraging predictive modeling to forecast campus placement trends and evaluate candidate ATS suitability.",
          techStack: ["React", "FastAPI", "PostgreSQL", "Tailwind CSS"],
          link: "https://github.com/akalya/atlas"
        },
        {
          id: "p_2",
          title: "Intelligent Medical Assistant",
          description: "A computer vision model optimized for segmenting chest X-Rays to identify respiratory conditions with 96.4% precision.",
          techStack: ["Python", "PyTorch", "U-Net", "OpenCV"]
        }
      ],
      internships: [
        {
          id: "i_1",
          company: "Google AI Research Labs",
          role: "ML Engineering Intern",
          duration: "3 Months (Summer 2025)",
          description: "Engineered scalable transformers and integrated prompt grounding mechanisms to enhance real-time multilingual translations."
        }
      ],
      certifications: [
        {
          id: "c_1",
          name: "Deep Learning Specialization",
          issuer: "DeepLearning.AI",
          year: "2024"
        },
        {
          id: "c_2",
          name: "Google Cloud Professional ML Engineer",
          issuer: "Google Cloud",
          year: "2025"
        }
      ],
      achievements: [
        "First Place in National Level Hackathon (Smart Campus Hackathon 2024)",
        "Academic Excellence Award for 3 consecutive years in Department of AI & DS"
      ],
      resumeUrl: "https://cloudinary.com/dummy/akalya_resume.pdf",
      resumeFileName: "Akalya_S_AI_DS_Resume.pdf",
      resumeApproved: "approved",
      atsScore: 88,
      atsFeedback: "Excellent resume structure. Outstanding alignment with high-paying machine learning and full-stack SDE placements. Recommended enhancements: highlight production deployment details.",
      skillGapAnalysis: ["Docker / Containerization", "Kubernetes", "GraphQL"],
      suggestedRoadmap: "Step 1: Learn container principles (Docker) within 2 weeks.\nStep 2: Deploy one of your existing FastAPI services into a mini-Kubernetes cluster.\nStep 3: Create a clean GraphQL endpoint as a layer over your PostgreSQL instance.",
      predictedPlacementChance: "High",
      completedPercent: 95
    },
    {
      userId: "student_2",
      enrollmentNo: "UR22CSE2051",
      department: "Computer Science Engineering",
      phone: "+91 94440 98765",
      academics: {
        board10th: 88.0,
        board12th: 85.5,
        cgpa: 7.82,
        standingArrears: 1,
        historyOfArrears: 2
      },
      skills: ["Java", "Spring Boot", "MySQL", "JavaScript", "HTML/CSS"],
      projects: [
        {
          id: "p_3",
          title: "Online Retail Platform",
          description: "An e-commerce portal handling cart checkouts, inventory updates, and order generation.",
          techStack: ["Java", "Spring Boot", "MySQL"]
        }
      ],
      internships: [],
      certifications: [
        {
          id: "c_3",
          name: "Oracle Certified Java Associate",
          issuer: "Oracle",
          year: "2024"
        }
      ],
      achievements: [
        "Runner up in Inter-collegiate Volleyball Tournament"
      ],
      resumeUrl: "https://cloudinary.com/dummy/rahul_resume.pdf",
      resumeFileName: "Rahul_Verma_CSE_Resume.pdf",
      resumeApproved: "pending",
      completedPercent: 65
    }
  ];

  const drives: PlacementDrive[] = [
    {
      id: "drive_nvidia",
      companyName: "NVIDIA",
      role: "Deep Learning SDE (TensorRT Team)",
      packageLPA: 42.5,
      eligibleDepts: [
        "Artificial Intelligence and Data Science",
        "Artificial Intelligence and Machine Learning",
        "Computer Science Engineering",
        "Electronics and Communication Engineering"
      ],
      minCGPA: 8.5,
      maxStandingArrears: 0,
      driveDate: "2026-07-20",
      location: "Bengaluru (On-site)",
      description: "NVIDIA is looking for outstanding student engineers to optimize core deep learning modules inside our TensorRT execution engines. Candidates must demonstrate deep knowledge of CUDA compilers, neural network execution topologies, and high-performance C++ modeling.",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "drive_google",
      companyName: "Google",
      role: "Associate Software Engineer (Core Cloud Infra)",
      packageLPA: 35.0,
      eligibleDepts: [
        "Artificial Intelligence and Data Science",
        "Artificial Intelligence and Machine Learning",
        "Computer Science Engineering",
        "Information Technology",
        "Computer and Communication Engineering"
      ],
      minCGPA: 8.0,
      maxStandingArrears: 0,
      driveDate: "2026-07-15",
      location: "Hyderabad (Hybrid)",
      description: "Join the Core Cloud Infrastructure group at Google to scale foundational APIs that power billions of requests every second. Robust mastery of algorithms, networks, and modular systems software engineering is essential.",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "drive_microsoft",
      companyName: "Microsoft",
      role: "SDE - Azure ML Services",
      packageLPA: 28.0,
      eligibleDepts: [
        "Artificial Intelligence and Data Science",
        "Artificial Intelligence and Machine Learning",
        "Computer Science Engineering",
        "Information Technology"
      ],
      minCGPA: 8.0,
      maxStandingArrears: 0,
      driveDate: "2026-08-05",
      location: "Bengaluru (Hybrid)",
      description: "Help customize Azure ML portals to host, deploy, and benchmark massive language model clusters globally. Proficiency in TypeScript, Python, and cloud architecture is highly valued.",
      status: "upcoming",
      createdAt: new Date().toISOString()
    },
    {
      id: "drive_accenture",
      companyName: "Accenture",
      role: "Associate Software Engineer",
      packageLPA: 6.5,
      eligibleDepts: [...SUPPORTED_DEPARTMENTS], // Eligible for all
      minCGPA: 6.0,
      maxStandingArrears: 2,
      driveDate: "2026-06-10",
      location: "Chennai (On-site)",
      description: "Empower global enterprises by engineering robust software systems and cloud-based migrations. Excellent communication and analytical skills are key.",
      status: "completed",
      createdAt: new Date().toISOString()
    },
    {
      id: "drive_tcs",
      companyName: "TCS",
      role: "Ninja / Digital Developer",
      packageLPA: 4.5,
      eligibleDepts: [...SUPPORTED_DEPARTMENTS],
      minCGPA: 6.0,
      maxStandingArrears: 1,
      driveDate: "2026-05-18",
      location: "Chennai (On-site)",
      description: "Kickstart your career at Tata Consultancy Services with advanced developer programs, learning industry methodologies and participating in enterprise scale sprints.",
      status: "completed",
      createdAt: new Date().toISOString()
    }
  ];

  const registrations: DriveRegistration[] = [
    {
      id: "reg_akalya_google",
      driveId: "drive_google",
      studentId: "student_akalya",
      studentName: "Akalya S",
      studentDept: "Artificial Intelligence and Data Science",
      studentCGPA: 9.35,
      resumeUrl: "https://cloudinary.com/dummy/akalya_resume.pdf",
      status: "shortlisted",
      appliedAt: "2026-07-01T10:00:00.000Z",
      interviewSchedule: "Technical Round 1: 2026-07-12 11:00 AM (Online Google Meet)",
      remarks: "Outstanding project achievements and strong ML credentials."
    },
    {
      id: "reg_akalya_accenture",
      driveId: "drive_accenture",
      studentId: "student_akalya",
      studentName: "Akalya S",
      studentDept: "Artificial Intelligence and Data Science",
      studentCGPA: 9.35,
      resumeUrl: "https://cloudinary.com/dummy/akalya_resume.pdf",
      status: "selected",
      appliedAt: "2026-06-01T09:00:00.000Z",
      remarks: "Selected as Developer with package 6.5 LPA!"
    }
  ];

  const announcements: Announcement[] = [
    {
      id: "ann_1",
      title: "Google Campus Recruitment Drive Announcement",
      content: "Google is coming to campus for SDE positions on July 15, 2026! Eligible departments are CSE, IT, CCE, AI&DS, and AI&ML with a minimum CGPA threshold of 8.0. Complete your profile, upload your resumes, and ensure your coordinator approves your resume by July 10, 2026. Drive registrations close on July 12.",
      department: "All",
      authorName: "Dr. Aris Kumar (Placement Officer)",
      createdAt: "2026-07-02T09:00:00.000Z"
    },
    {
      id: "ann_2",
      title: "Urgent Resume Verification Deadline for AI & DS Students",
      content: "To all AI&DS final year students, please update your resume uploads immediately. Profiles with unapproved resumes will not be exported to NVIDIA and Google databases. Resume screening starts tomorrow.",
      department: "Artificial Intelligence and Data Science",
      authorName: "Dr. Shalini Sen",
      createdAt: "2026-07-03T14:30:00.000Z"
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "log_1",
      userId: "officer_1",
      userName: "Dr. Aris Kumar",
      role: "officer",
      action: "Create Drive",
      details: "Created placement drive for NVIDIA with 42.5 LPA package.",
      timestamp: "2026-07-02T10:15:00.000Z"
    },
    {
      id: "log_2",
      userId: "coord_aids",
      userName: "Dr. Shalini Sen",
      role: "coordinator",
      action: "Approve Resume",
      details: "Approved Akalya S's resume after reviewing deep learning credentials.",
      timestamp: "2026-07-03T11:00:00.000Z"
    },
    {
      id: "log_3",
      userId: "student_akalya",
      userName: "Akalya S",
      role: "student",
      action: "Drive Registration",
      details: "Registered for Google Campus Recruitment Drive.",
      timestamp: "2026-07-03T12:00:00.000Z"
    }
  ];

  const notifications: Notification[] = [
    {
      id: "not_1",
      userId: "student_akalya",
      title: "Resume Approved!",
      content: "Dr. Shalini Sen approved your resume for campus placement drives.",
      type: "system",
      isRead: false,
      createdAt: "2026-07-03T11:00:00.000Z"
    },
    {
      id: "not_2",
      userId: "student_akalya",
      title: "Google Shortlist!",
      content: "Congratulations! You have been shortlisted for Google Technical Interview Round 1.",
      type: "selection",
      isRead: false,
      createdAt: "2026-07-03T15:00:00.000Z"
    },
    {
      id: "not_3",
      userId: "all",
      title: "New Placement Drive: NVIDIA",
      content: "NVIDIA deep learning campus drive is active. Check eligibility and register now!",
      type: "drive",
      isRead: false,
      createdAt: "2026-07-02T10:16:00.000Z"
    }
  ];

  return {
    users,
    studentProfiles,
    drives,
    registrations,
    announcements,
    auditLogs,
    notifications
  };
};

class DBManager {
  private state: DBState;

  constructor() {
    this.state = this.load();
  }

  private load(): DBState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        if (fileContent.trim()) {
          const parsed = JSON.parse(fileContent);
          // Standard validation check to verify all keys exist
          if (parsed.users && parsed.drives && parsed.studentProfiles) {
            return parsed;
          }
        }
      }

      // If no file, write seed data
      const seed = getSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
      return seed;
    } catch (e) {
      console.error("Error loading database file. Initializing with seed.", e);
      return getSeedData();
    }
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database file.", e);
    }
  }

  // --- QUERY UTILITIES ---
  public getUsers() { return this.state.users; }
  public getStudentProfiles() { return this.state.studentProfiles; }
  public getDrives() { return this.state.drives; }
  public getRegistrations() { return this.state.registrations; }
  public getAnnouncements() { return this.state.announcements; }
  public getAuditLogs() { return this.state.auditLogs; }
  public getNotifications() { return this.state.notifications; }

  // --- MUTATION UTILITIES ---
  public addUser(user: User): User {
    this.state.users.push(user);
    this.save();
    return user;
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      this.save();
    }
    return user;
  }

  public getStudentProfile(userId: string): StudentProfile | undefined {
    return this.state.studentProfiles.find(p => p.userId === userId);
  }

  public saveStudentProfile(profile: StudentProfile): StudentProfile {
    const index = this.state.studentProfiles.findIndex(p => p.userId === profile.userId);
    if (index !== -1) {
      this.state.studentProfiles[index] = profile;
    } else {
      this.state.studentProfiles.push(profile);
    }
    this.save();
    return profile;
  }

  public addDrive(drive: PlacementDrive): PlacementDrive {
    this.state.drives.push(drive);
    this.save();
    return drive;
  }

  public updateDrive(driveId: string, updates: Partial<PlacementDrive>): PlacementDrive | undefined {
    const drive = this.state.drives.find(d => d.id === driveId);
    if (drive) {
      Object.assign(drive, updates);
      this.save();
    }
    return drive;
  }

  public deleteDrive(driveId: string): boolean {
    const initialLen = this.state.drives.length;
    this.state.drives = this.state.drives.filter(d => d.id !== driveId);
    if (this.state.drives.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addRegistration(registration: DriveRegistration): DriveRegistration {
    this.state.registrations.push(registration);
    this.save();
    return registration;
  }

  public updateRegistration(registrationId: string, updates: Partial<DriveRegistration>): DriveRegistration | undefined {
    const reg = this.state.registrations.find(r => r.id === registrationId);
    if (reg) {
      Object.assign(reg, updates);
      this.save();
    }
    return reg;
  }

  public addAnnouncement(announcement: Announcement): Announcement {
    this.state.announcements.unshift(announcement);
    this.save();
    return announcement;
  }

  public deleteAnnouncement(id: string): boolean {
    const initialLen = this.state.announcements.length;
    this.state.announcements = this.state.announcements.filter(a => a.id !== id);
    if (this.state.announcements.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addAuditLog(log: AuditLog): AuditLog {
    this.state.auditLogs.unshift(log);
    this.save();
    return log;
  }

  public addNotification(notification: Notification): Notification {
    this.state.notifications.unshift(notification);
    this.save();
    return notification;
  }

  public markNotificationsRead(userId: string): void {
    this.state.notifications.forEach(n => {
      if (n.userId === userId || n.userId === "all") {
        n.isRead = true;
      }
    });
    this.save();
  }
}

export const db = new DBManager();
