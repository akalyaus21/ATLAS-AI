import React, { useState, useEffect } from "react";
import { 
  User, 
  StudentProfile, 
  PlacementDrive, 
  Notification, 
  Announcement,
  Project,
  Internship,
  Certification,
  AcademicDetails
} from "../types";
import { 
  Award, 
  BookOpen, 
  CheckCircle, 
  Cpu, 
  DollarSign, 
  FileText, 
  Plus, 
  Search, 
  Send, 
  Sparkles, 
  Terminal, 
  Trash2, 
  TrendingUp, 
  Upload, 
  User as UserIcon,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Bell,
  Briefcase,
  Download
} from "lucide-react";

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "drives" | "ai">("overview");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Local loading / message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Form States
  const [phone, setPhone] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [board10th, setBoard10th] = useState(0);
  const [board12th, setBoard12th] = useState(0);
  const [cgpa, setCgpa] = useState(0);
  const [standingArrears, setStandingArrears] = useState(0);
  const [historyOfArrears, setHistoryOfArrears] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  
  // Projects states
  const [projects, setProjects] = useState<Project[]>([]);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projLink, setProjLink] = useState("");

  // Internship states
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internCompany, setInternCompany] = useState("");
  const [internRole, setInternRole] = useState("");
  const [internDuration, setInternDuration] = useState("");
  const [internDesc, setInternDesc] = useState("");

  // Certification states
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certYear, setCertYear] = useState("");

  // Achievements states
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");

  // Resume Upload State
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // AI Assistant States
  const [aiMessage, setAiMessage] = useState("");
  const [aiChat, setAiChat] = useState<Array<{ sender: "user" | "atlas"; text: string }>>([
    { sender: "atlas", text: "Greetings! I am ATLAS, your AI-Driven Placement Intelligence Assistant. How can I help maximize your campus recruitment opportunities today?" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch initial student data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get profile
      const profRes = await fetch(`/api/student/profile/${user.id}`);
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
        // Seed form fields
        setPhone(profData.phone || "");
        setEnrollmentNo(profData.enrollmentNo || "");
        setBoard10th(profData.academics?.board10th || 0);
        setBoard12th(profData.academics?.board12th || 0);
        setCgpa(profData.academics?.cgpa || 0);
        setStandingArrears(profData.academics?.standingArrears || 0);
        setHistoryOfArrears(profData.academics?.historyOfArrears || 0);
        setSkills(profData.skills || []);
        setProjects(profData.projects || []);
        setInternships(profData.internships || []);
        setCertifications(profData.certifications || []);
        setAchievements(profData.achievements || []);
      }

      // 2. Get registered & eligible drives
      const driveRes = await fetch(`/api/student/drives/${user.id}`);
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        setDrives(driveData);
      }

      // 3. Get Announcements
      const annRes = await fetch("/api/announcements");
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData.filter((a: Announcement) => a.department === "All" || a.department === user.department));
      }

      // 4. Get Notifications
      const notRes = await fetch(`/api/notifications/${user.id}`);
      if (notRes.ok) {
        const notData = await notRes.json();
        setNotifications(notData);
      }
    } catch (err) {
      console.error("Error retrieving student profile metrics.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id, activeTab]);

  // Handle profile update submit
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      phone,
      enrollmentNo,
      academics: {
        board10th: Number(board10th),
        board12th: Number(board12th),
        cgpa: Number(cgpa),
        standingArrears: Number(standingArrears),
        historyOfArrears: Number(historyOfArrears)
      },
      skills,
      projects,
      internships,
      certifications,
      achievements
    };

    try {
      const response = await fetch(`/api/student/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update profile.");
      
      setProfile(data.profile);
      setSuccessMsg("System profile parameters updated successfully!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Add list items locally
  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, i) => i !== indexToRemove));
  };

  const addProject = () => {
    if (projTitle && projDesc) {
      const p: Project = {
        id: `p_${Date.now()}`,
        title: projTitle,
        description: projDesc,
        techStack: projTech.split(",").map(t => t.trim()).filter(Boolean),
        link: projLink || undefined
      };
      setProjects([...projects, p]);
      setProjTitle("");
      setProjDesc("");
      setProjTech("");
      setProjLink("");
    }
  };

  const addInternship = () => {
    if (internCompany && internRole) {
      const i: Internship = {
        id: `i_${Date.now()}`,
        company: internCompany,
        role: internRole,
        duration: internDuration,
        description: internDesc
      };
      setInternships([...internships, i]);
      setInternCompany("");
      setInternRole("");
      setInternDuration("");
      setInternDesc("");
    }
  };

  const addCertification = () => {
    if (certName && certIssuer) {
      const c: Certification = {
        id: `c_${Date.now()}`,
        name: certName,
        issuer: certIssuer,
        year: certYear
      };
      setCertifications([...certifications, c]);
      setCertName("");
      setCertIssuer("");
      setCertYear("");
    }
  };

  const addAchievement = () => {
    if (newAchievement && !achievements.includes(newAchievement)) {
      setAchievements([...achievements, newAchievement]);
      setNewAchievement("");
    }
  };

  // Real resume file uploads with progress tracking
  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5 MB limit.");
      return;
    }
    if (selectedFile.type !== "application/pdf") {
      setErrorMsg("Only PDF files are allowed.");
      return;
    }

    setUploadingResume(true);
    setUploadProgress(0);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("resume", selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/student/resume/upload/${user.id}`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = async () => {
      setUploadingResume(false);
      setUploadProgress(null);
      try {
        const responseText = xhr.responseText;
        const data = JSON.parse(responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          setProfile(data.profile);
          setSelectedFile(null);
          setSuccessMsg(data.message || "Resume PDF uploaded successfully!");
          // Clean the input field if elements exist
          const fileInput = document.getElementById("resume-file-input") as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        } else {
          setErrorMsg(data.error || "Failed to upload resume.");
        }
      } catch (err) {
        setErrorMsg("Failed to parse response from server.");
      }
    };

    xhr.onerror = () => {
      setUploadingResume(false);
      setUploadProgress(null);
      setErrorMsg("Network error occurred during file upload.");
    };

    xhr.send(formData);
  };

  // Register for active drives
  const handleDriveRegister = async (driveId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch("/api/student/drives/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, driveId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not complete registration.");

      setSuccessMsg(data.message);
      fetchData(); // reload
    } catch (err: any) {
      setErrorMsg(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit profile to ATLAS AI for resume screening
  const triggerAIResumeAnalysis = async () => {
    if (!profile) return;
    setAiLoading(true);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "resume_review",
          payload: { profile }
        })
      });
      
      const data = await response.json();
      if (response.ok && data.aiResponse) {
        const { atsScore, atsFeedback, skillGapAnalysis, suggestedRoadmap, predictedPlacementChance } = data.aiResponse;
        
        // Update profile in state with AI parameters
        const updatedProfile: StudentProfile = {
          ...profile,
          atsScore,
          atsFeedback,
          skillGapAnalysis,
          suggestedRoadmap,
          predictedPlacementChance
        };
        
        // Save back to db
        await fetch(`/api/student/profile/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProfile)
        });

        setProfile(updatedProfile);
        setSuccessMsg("ATLAS Placement AI completed comprehensive resume review & scoring!");
        setActiveTab("ai");
      }
    } catch (err) {
      console.error("AI integration analysis interrupted.", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Submit question inside chat assistant
  const sendAIChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    const userMsg = aiMessage;
    setAiChat(prev => [...prev, { sender: "user", text: userMsg }]);
    setAiMessage("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "general_chat",
          payload: {
            userMessage: userMsg,
            chatHistory: aiChat
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.aiResponse) {
        setAiChat(prev => [...prev, { sender: "atlas", text: typeof data.aiResponse === 'string' ? data.aiResponse : JSON.stringify(data.aiResponse) }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      setAiChat(prev => [...prev, { sender: "atlas", text: "Apologies, I encountered a minor communication sync issue. Please retry." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Unread notifications tracker
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markNotificationsRead = async () => {
    try {
      await fetch(`/api/notifications/${user.id}/read`, { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative">
      {/* Background glowing effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Modern Dashboard Header */}
      <header className="z-20 sticky top-0 bg-slate-950/70 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="animate-spin-slow" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              ATLAS <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">STUDENT</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">AI Placement Portal</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-cyan-500/20 text-cyan-400 border-b border-cyan-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "profile" ? "bg-cyan-500/20 text-cyan-400 border-b border-cyan-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            EDIT PROFILE
          </button>
          <button
            onClick={() => setActiveTab("drives")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "drives" ? "bg-cyan-500/20 text-cyan-400 border-b border-cyan-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            PLACEMENT DRIVES
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ai" ? "bg-purple-500/20 text-purple-300 border-b border-purple-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={12} className="text-purple-400" />
            ATLAS AI
          </button>
        </nav>

        {/* User control buttons */}
        <div className="flex items-center gap-4">
          {/* Notifications bell dropdown button */}
          <div className="relative group">
            <button 
              onClick={markNotificationsRead}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Hover dropdown list */}
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-50">
              <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5">RECRUITMENT FEED</h4>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic text-center py-2">No notifications found.</p>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`p-2 rounded-lg bg-slate-950/40 border ${n.isRead ? 'border-slate-950' : 'border-cyan-500/20'}`}>
                      <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.content}</p>
                      <span className="text-[8px] text-slate-500 block text-right mt-1 font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-semibold text-slate-100">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">{user.department.substring(0, 30)}...</p>
            </div>
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/25 hover:border-red-500/50 text-red-400 font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* Alert Messages */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold uppercase tracking-widest">TRANSACTION SUCCEEDED</span>
            </div>
            <p>{successMsg}</p>
          </div>
        )}

        {/* Mobile Navigation controls */}
        <div className="flex md:hidden grid grid-cols-4 gap-1.5 bg-slate-900/60 p-1 border border-slate-800 rounded-xl">
          {(["overview", "profile", "drives", "ai"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 text-[10px] rounded-lg font-mono text-center transition-all ${
                activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 border-b border-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ====================================
            TAB: OVERVIEW (STUDENT DASHBOARD)
            ==================================== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Column 1 & 2: Quick metrics & Activity Feed */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Profile Completeness card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Welcome Back, {user.name}!</h2>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                      Your institutional profile parameters are compiled. Utilize ATLAS Placement AI to review ATS score matches and discover high-paying eligibility options.
                    </p>
                    
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-[10px] font-mono uppercase bg-slate-950 px-2.5 py-1 border border-slate-800 text-slate-400 rounded-md">ID: {profile?.enrollmentNo || "NOT GENERATED"}</span>
                      <span className={`text-[10px] font-mono uppercase px-2.5 py-1 border rounded-md ${
                        profile?.resumeApproved === "approved" 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : profile?.resumeApproved === "rejected"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}>
                        Resume: {profile?.resumeApproved?.toUpperCase() || "PENDING"}
                      </span>
                    </div>
                  </div>

                  {/* Circle Completion Chart */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="44" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="56" cy="56" r="44" 
                        stroke="#06b6d4" strokeWidth="8" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 44}
                        strokeDashoffset={2 * Math.PI * 44 * (1 - (profile?.completedPercent || 0) / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white font-mono">{profile?.completedPercent || 10}%</span>
                      <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">Complete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of basic stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Academic CGPA</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono">{profile?.academics?.cgpa || "0.0"}</span>
                </div>
                <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Standing Arrears</span>
                  <span className="text-2xl font-black text-purple-400 font-mono">{profile?.academics?.standingArrears ?? 0}</span>
                </div>
                <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">ATS Match Score</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{profile?.atsScore ? `${profile.atsScore}%` : "N/A"}</span>
                </div>
                <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Registered Drives</span>
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    {drives.filter(d => d.registration).length}
                  </span>
                </div>
              </div>

              {/* Eligible Active Placement drives */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-md font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                    <Briefcase size={16} /> Eligible Campus Recruitment Drives
                  </h3>
                  <button 
                    onClick={() => setActiveTab("drives")}
                    className="text-xs text-cyan-400 font-mono uppercase tracking-wider hover:underline"
                  >
                    View All ({drives.length})
                  </button>
                </div>

                <div className="space-y-4">
                  {drives.filter(d => d.isEligible && d.status === 'active' && !d.registration).slice(0, 3).map((drive) => (
                    <div key={drive.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/20 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{drive.companyName}</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{drive.packageLPA} LPA</span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">{drive.role}</p>
                        <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1"><Calendar size={12} /> Date: {drive.driveDate}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {drive.location}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDriveRegister(drive.id)}
                        className="px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)] self-start md:self-auto"
                      >
                        REGISTER NOW
                      </button>
                    </div>
                  ))}

                  {drives.filter(d => d.isEligible && d.status === 'active' && !d.registration).length === 0 && (
                    <p className="text-xs text-slate-500 font-mono italic text-center py-4">No eligible unregistered drives open at the moment.</p>
                  )}
                </div>
              </div>

              {/* Timeline of Student application Pipeline */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-lg">
                <h3 className="text-md font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                  <Clock size={16} /> Placement Progress Timeline
                </h3>

                <div className="relative pl-6 border-l border-slate-800 space-y-6">
                  {drives.filter(d => d.registration).map((drive) => {
                    const reg = drive.registration;
                    let color = "bg-slate-700";
                    if (reg.status === "selected") color = "bg-emerald-500";
                    else if (reg.status === "rejected") color = "bg-red-500";
                    else if (reg.status === "shortlisted" || reg.status === "interviewing") color = "bg-purple-500 animate-pulse";
                    else if (reg.status === "applied") color = "bg-blue-500";

                    return (
                      <div key={drive.id} className="relative">
                        <span className={`absolute -left-8.5 top-1 w-5 h-5 rounded-full ${color} border border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950`}>
                          {reg.status[0].toUpperCase()}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{drive.companyName}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase ${
                              reg.status === "selected" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : reg.status === "rejected"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                              {reg.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{drive.role} • Registered on {new Date(reg.appliedAt).toLocaleDateString()}</p>
                          {reg.interviewSchedule && (
                            <div className="mt-2 p-3 bg-slate-950/80 border border-slate-800 text-xs text-cyan-400 rounded-xl font-mono flex items-center gap-2">
                              <Calendar size={14} />
                              <span>{reg.interviewSchedule}</span>
                            </div>
                          )}
                          {reg.remarks && (
                            <p className="text-[11px] text-slate-500 italic mt-1">Remarks: "{reg.remarks}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {drives.filter(d => d.registration).length === 0 && (
                    <div className="text-center text-slate-500 text-xs py-4 italic">No drive registrations recorded yet. Register for eligible drives to track pipelines.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Column 3: Announcements Feed & Resume Upload */}
            <div className="space-y-8">
              
              {/* Cloudinary Resume upload */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-lg">
                <h3 className="text-md font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
                  <Upload size={16} /> Placement Resume Storage
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Upload your professional PDF resume to secure coordinator verification and unlock placement registrations.
                </p>

                {profile?.resumeUrl ? (
                  <div className="space-y-3 mb-4">
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={24} className="text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{profile.resumeFileName || "Uploaded_Resume.pdf"}</p>
                          <span className="text-[9px] text-slate-500 font-mono uppercase block mt-0.5">STORED SECURELY</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase border shrink-0 ${
                        profile.resumeApproved === 'approved' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : profile.resumeApproved === 'rejected'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {profile.resumeApproved}
                      </span>
                    </div>

                    {/* Preview and Download Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-[10px] font-mono font-bold uppercase rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 hover:bg-slate-900 hover:border-cyan-500/20 transition-all cursor-pointer text-center"
                      >
                        <Search size={12} /> Preview
                      </a>
                      <a
                        href={profile.resumeUrl}
                        download={profile.resumeFileName || "Resume.pdf"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-[10px] font-mono font-bold uppercase rounded-lg bg-slate-950 border border-slate-800 text-purple-400 hover:bg-slate-900 hover:border-purple-500/20 transition-all cursor-pointer text-center"
                      >
                        <Download size={12} /> Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-center text-slate-500 text-xs font-mono py-6 mb-4">
                    No verified resume file detected.
                  </div>
                )}

                {/* PDF File picker & upload system */}
                <form onSubmit={handleResumeUpload} className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      id="resume-file-input"
                      accept="application/pdf"
                      onChange={(e) => {
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          if (file.type !== "application/pdf") {
                            setErrorMsg("Invalid file type. Only PDF files are allowed.");
                            setSelectedFile(null);
                            e.target.value = "";
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            setErrorMsg("File is too large. Maximum size allowed is 5 MB.");
                            setSelectedFile(null);
                            e.target.value = "";
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                      className="hidden"
                    />
                    
                    <label
                      htmlFor="resume-file-input"
                      className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-950/60 hover:border-cyan-500/30 transition-all cursor-pointer text-center group"
                    >
                      <Upload className="text-slate-500 group-hover:text-cyan-400 mb-1.5 transition-all" size={20} />
                      <span className="text-[10px] font-mono font-semibold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 group-hover:bg-cyan-500/20">
                        {selectedFile ? "Change PDF File" : "Choose File"}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1.5">
                        PDF format only (Max 5 MB)
                      </span>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="text-cyan-400 shrink-0" size={14} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono font-bold text-slate-200 truncate">{selectedFile.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          const fInput = document.getElementById("resume-file-input") as HTMLInputElement;
                          if (fInput) fInput.value = "";
                        }}
                        className="text-slate-400 hover:text-red-400 font-bold px-1.5 py-0.5 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {uploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-cyan-400">
                        <span>Uploading file...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploadingResume || !selectedFile}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-bold uppercase rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cyan-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)] font-semibold"
                  >
                    {uploadingResume ? "Uploading to Cloud..." : "Upload Selected Resume"}
                    <Upload size={12} />
                  </button>
                </form>

                {profile?.resumeComments && (
                  <div className="mt-4 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300">
                    <span className="font-bold block mb-1 font-mono uppercase text-[9px] tracking-wider">Coordinator Feedback:</span>
                    "{profile.resumeComments}"
                  </div>
                )}
              </div>

              {/* Department Announcements Feed */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-lg">
                <h3 className="text-md font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
                  <Bell size={16} /> Campus Announcements
                </h3>

                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 text-[8px] font-mono rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">{ann.department}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-relaxed mb-1.5">{ann.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      <span className="text-[9px] text-slate-500 block text-right mt-2 font-mono">— {ann.authorName}</span>
                    </div>
                  ))}

                  {announcements.length === 0 && (
                    <p className="text-xs text-slate-500 font-mono italic text-center py-4">No announcement bulletins active.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================
            TAB: PROFILE EDITOR (FORM-FIELDS)
            ==================================== */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileUpdate} className="space-y-8 bg-slate-900/20 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-lg max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Configure Placement Profile</h2>
              <p className="text-xs text-slate-400 mt-1">Specify detailed scholastic metrics, verified skillsets, past projects, and internships to fulfill eligibility requirements.</p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2 tracking-wider">University Enrollment Number</label>
                <input
                  type="text"
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                  placeholder="UR22AIDS1000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2 tracking-wider">Contact Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 90000 00000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Academic Scholastics */}
            <div className="border-t border-slate-800/80 pt-6">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-4">Academic Scholastics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">10th Score (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={board10th}
                    onChange={(e) => setBoard10th(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">12th Score (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={board12th}
                    onChange={(e) => setBoard12th(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Current CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cgpa}
                    onChange={(e) => setCgpa(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Standing Arrears</label>
                  <input
                    type="number"
                    value={standingArrears}
                    onChange={(e) => setStandingArrears(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Arrears History</label>
                  <input
                    type="number"
                    value={historyOfArrears}
                    onChange={(e) => setHistoryOfArrears(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Core Skills Add */}
            <div className="border-t border-slate-800/80 pt-6">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-3">Core Skills</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((s, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                    {s}
                    <button type="button" onClick={() => removeSkill(idx)} className="text-red-400 hover:text-red-300 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="React, PyTorch, Docker..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-slate-800 border border-slate-750 text-xs font-mono rounded-xl hover:bg-slate-750 cursor-pointer text-cyan-400"
                >
                  ADD SKILL
                </button>
              </div>
            </div>

            {/* Academic Projects details */}
            <div className="border-t border-slate-800/80 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">Academic Projects</h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">{projects.length} added</span>
              </div>

              {projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {projects.map((p, idx) => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 relative">
                      <button
                        type="button"
                        onClick={() => setProjects(projects.filter(proj => proj.id !== p.id))}
                        className="absolute right-3 top-3 text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                      <h4 className="text-xs font-bold text-white">{p.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{p.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.techStack.map((tech, i) => (
                          <span key={i} className="text-[9px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">{tech}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-850 space-y-4 max-w-xl">
                <h4 className="text-xs font-mono font-semibold text-slate-300">Add Project Parameter</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none"
                  />
                  <textarea
                    placeholder="Brief description of project outcomes..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack (comma-separated: React, Node, etc.)"
                    value={projTech}
                    onChange={(e) => setProjTech(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="GitHub repository link (Optional)"
                    value={projLink}
                    onChange={(e) => setProjLink(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addProject}
                    className="flex items-center gap-1.5 py-2 px-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono rounded-xl hover:bg-cyan-500/25 cursor-pointer font-bold"
                  >
                    <Plus size={14} /> ADD PROJECT
                  </button>
                </div>
              </div>
            </div>

            {/* Internships, Certifications, and Achievements modules */}
            <div className="border-t border-slate-800/80 pt-6 space-y-6">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">Practical Internships & Certifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Internships segment */}
                <div className="space-y-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Internship Records ({internships.length})</span>
                  {internships.map(i => (
                    <div key={i.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-white">{i.company}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{i.role} • {i.duration}</p>
                      </div>
                      <button type="button" onClick={() => setInternships(internships.filter(item => item.id !== i.id))} className="text-red-400 cursor-pointer text-xs">×</button>
                    </div>
                  ))}
                  <div className="p-3.5 rounded-xl bg-slate-950/20 border border-slate-850 space-y-2">
                    <input type="text" placeholder="Company Name" value={internCompany} onChange={e => setInternCompany(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono" />
                    <input type="text" placeholder="Role (e.g., Software Intern)" value={internRole} onChange={e => setInternRole(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono" />
                    <input type="text" placeholder="Duration (e.g., Summer 2025)" value={internDuration} onChange={e => setInternDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono" />
                    <button type="button" onClick={addInternship} className="text-[10px] font-mono text-cyan-400 uppercase block font-semibold cursor-pointer">+ ADD RECORD</button>
                  </div>
                </div>

                {/* Certifications Segment */}
                <div className="space-y-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Certifications ({certifications.length})</span>
                  {certifications.map(c => (
                    <div key={c.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.issuer} • {c.year}</p>
                      </div>
                      <button type="button" onClick={() => setCertifications(certifications.filter(item => item.id !== c.id))} className="text-red-400 cursor-pointer text-xs">×</button>
                    </div>
                  ))}
                  <div className="p-3.5 rounded-xl bg-slate-950/20 border border-slate-850 space-y-2">
                    <input type="text" placeholder="Certification Name" value={certName} onChange={e => setCertName(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono" />
                    <input type="text" placeholder="Issuer (e.g., AWS, Coursera)" value={certIssuer} onChange={e => setCertIssuer(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono" />
                    <input type="text" placeholder="Year" value={certYear} onChange={e => setCertYear(e.target.value.replace(/\D/g, ""))} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono" />
                    <button type="button" onClick={addCertification} className="text-[10px] font-mono text-cyan-400 uppercase block font-semibold cursor-pointer">+ ADD RECORD</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="border-t border-slate-800/80 pt-6">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-3">Honors & Achievements</h3>
              <ul className="space-y-2 mb-4">
                {achievements.map((ach, index) => (
                  <li key={index} className="flex justify-between items-center text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                    <span>🏆 {ach}</span>
                    <button type="button" onClick={() => setAchievements(achievements.filter((_, i) => i !== index))} className="text-red-400 cursor-pointer">×</button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Hackathon Win, Scholar Award..."
                  value={newAchievement}
                  onChange={e => setNewAchievement(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none"
                />
                <button type="button" onClick={addAchievement} className="px-3.5 py-1.5 bg-slate-850 border border-slate-750 text-xs font-mono text-cyan-400 rounded-lg cursor-pointer">ADD</button>
              </div>
            </div>

            {/* Update Profile Submit Button */}
            <div className="border-t border-slate-800/80 pt-6 flex items-center justify-between">
              {/* Review triggers AI analysis */}
              <button
                type="button"
                onClick={triggerAIResumeAnalysis}
                disabled={aiLoading || !profile?.resumeUrl}
                className="flex items-center gap-2 py-3 px-5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={16} className={aiLoading ? "animate-spin" : ""} />
                {aiLoading ? "ATLAS SCREENING RESUME..." : "ATLAS AI ATS REVIEW"}
              </button>

              <button
                type="submit"
                className="py-3 px-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono uppercase font-bold tracking-wider text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              >
                COMPILE PARAMETERS
              </button>
            </div>
          </form>
        )}

        {/* ====================================
            TAB: PLACEMENT DRIVES (LIST)
            ==================================== */}
        {activeTab === "drives" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Active Recruiter Portal</h2>
                <p className="text-xs text-slate-400 mt-1">Review live active placements, compensation details, and application states matching your branch eligibility.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {drives.map((drive) => {
                const reg = drive.registration;
                const elig = drive.isEligible;

                return (
                  <div key={drive.id} className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl backdrop-blur-md hover:border-cyan-500/15 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Drive specs */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-black text-white">{drive.companyName}</h3>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                            {drive.packageLPA} LPA PACKAGE
                          </span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border uppercase ${
                            drive.status === 'active' 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' 
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}>
                            {drive.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-purple-400 uppercase tracking-wider">{drive.role}</p>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl pt-1">{drive.description}</p>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-[11px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1"><Calendar size={13} /> Evaluation: {drive.driveDate}</span>
                          <span className="flex items-center gap-1"><MapPin size={13} /> Location: {drive.location}</span>
                          <span className="flex items-center gap-1"><Award size={13} /> Minimum Threshold: {drive.minCGPA} CGPA</span>
                        </div>

                        {/* Eligible branches chips */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {drive.eligibleDepts.map((d: string, idx: number) => (
                            <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400">{d}</span>
                          ))}
                        </div>
                      </div>

                      {/* Action status button */}
                      <div className="shrink-0 pt-4 md:pt-0 self-start md:self-auto">
                        {reg ? (
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono uppercase font-bold border ${
                              reg.status === 'selected' 
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                : reg.status === 'rejected'
                                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                  : 'bg-purple-500/15 border-purple-500/30 text-purple-400 animate-pulse'
                            }`}>
                              {reg.status === 'selected' && <CheckCircle size={12} />}
                              {reg.status === 'rejected' && <XCircle size={12} />}
                              {reg.status.toUpperCase()}
                            </span>
                            <span className="block text-[9px] text-slate-500 font-mono mt-1">APPLIED ON {new Date(reg.appliedAt).toLocaleDateString()}</span>
                          </div>
                        ) : elig ? (
                          profile?.resumeApproved === "approved" ? (
                            <button
                              onClick={() => handleDriveRegister(drive.id)}
                              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-mono font-bold tracking-wider uppercase hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
                            >
                              REGISTER FOR DRIVE
                            </button>
                          ) : (
                            <div className="text-right max-w-[180px]">
                              <button
                                disabled
                                className="w-full px-4 py-2 text-[10px] rounded-xl bg-slate-800 text-slate-500 font-mono uppercase font-bold cursor-not-allowed border border-slate-750"
                              >
                                REGISTER LOCKED
                              </button>
                              <span className="block text-[9px] text-amber-500 font-mono mt-1 leading-normal text-right">Requires Coordinator approved resume before registration.</span>
                            </div>
                          )
                        ) : (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono uppercase">INELIGIBLE</span>
                            <div className="mt-1 text-[9px] text-slate-500 font-mono text-right space-y-0.5">
                              {!drive.eligibilityReasons.dept && <div>Branch mismatch</div>}
                              {!drive.eligibilityReasons.cgpa && <div>CGPA below threshold ({drive.minCGPA})</div>}
                              {!drive.eligibilityReasons.arrears && <div>Excess active arrears</div>}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}

              {drives.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8 italic">No campus recruitment drives listed.</div>
              )}
            </div>
          </div>
        )}

        {/* ====================================
            TAB: ATLAS AI ASSISTANT (CHAT/METRICS)
            ==================================== */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Column 1 & 2: Chat Assistant Core */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md flex flex-col h-[550px] overflow-hidden">
                {/* Chat Panel Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-widest">ATLAS PLACEMENT AI CLIENT</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">MODEL: GEMINI 3.5 FLASH</span>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {aiChat.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200" 
                          : "bg-slate-950/80 border border-slate-850 text-slate-300"
                      }`}>
                        <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1 font-bold">
                          {msg.sender === "user" ? "STUDENT (YOU)" : "ATLAS CO-INTELLIGENCE"}
                        </span>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}

                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-xs font-mono text-purple-400 animate-pulse flex items-center gap-2">
                        <Cpu className="animate-spin" size={14} />
                        <span>ATLAS CONSTRUCTING PLACEMENT FORECASTS...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={sendAIChatMessage} className="p-4 border-t border-slate-800 bg-slate-950/60 flex gap-2">
                  <input
                    type="text"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="Ask ATLAS about core algorithms, NVIDIA interview questions, or roadmap milestones..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiMessage.trim()}
                    className="p-3 rounded-xl bg-purple-500 text-slate-950 hover:bg-purple-400 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>

            {/* Column 3: AI Resume Scores & Gap Analysis */}
            <div className="space-y-6">
              
              {/* ATS matching scores and predictions */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
                <h3 className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold mb-4 flex items-center gap-1.5">
                  <Sparkles size={14} /> ATLAS ATS Score card
                </h3>

                {profile?.atsScore ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-black text-purple-400 font-mono tracking-tight">{profile.atsScore}%</div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">PLACABILITY SCORE</span>
                        <span className={`text-[10px] font-mono uppercase font-bold ${
                          profile.predictedPlacementChance === 'High' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          CHANCE: {profile.predictedPlacementChance || "MEDIUM"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-850 pt-3">
                      {profile.atsFeedback}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-500 font-mono italic mb-3">No ATS scorecard detected.</p>
                    <button
                      onClick={triggerAIResumeAnalysis}
                      disabled={aiLoading || !profile?.resumeUrl}
                      className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-mono uppercase font-semibold cursor-pointer"
                    >
                      <Sparkles size={12} />
                      RUN RECRUITMENT ANALYSIS
                    </button>
                  </div>
                )}
              </div>

              {/* Skill Gap Analyzer */}
              {profile?.skillGapAnalysis && profile.skillGapAnalysis.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
                    <Cpu size={14} /> Recommended Skills to Acquire
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skillGapAnalysis.map((skill, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Item Roadmap */}
              {profile?.suggestedRoadmap && (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
                    <TrendingUp size={14} /> ATLAS Suggested Learning Roadmap
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    {profile.suggestedRoadmap}
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
