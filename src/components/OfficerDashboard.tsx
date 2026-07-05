import React, { useState, useEffect } from "react";
import { 
  User, 
  PlacementDrive, 
  DriveRegistration, 
  AuditLog, 
  SUPPORTED_DEPARTMENTS 
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
  Check,
  Building,
  Users,
  Briefcase,
  BarChart3,
  Download,
  Percent
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from "recharts";

interface OfficerDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function OfficerDashboard({ user, onLogout }: OfficerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "drives" | "applicants" | "reports" | "ai">("overview");
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>("");
  const [registrants, setRegistrants] = useState<DriveRegistration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Placement Drive Form States
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [packageLPA, setPackageLPA] = useState("");
  const [minCGPA, setMinCGPA] = useState("8.0");
  const [maxStandingArrears, setMaxStandingArrears] = useState("0");
  const [eligibleDepts, setEligibleDepts] = useState<string[]>([...SUPPORTED_DEPARTMENTS]);
  const [driveDate, setDriveDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Applicant shortlisting action states
  const [selectedReg, setSelectedReg] = useState<DriveRegistration | null>(null);
  const [regStatus, setRegStatus] = useState<any>("shortlisted");
  const [interviewSchedule, setInterviewSchedule] = useState("");
  const [remarks, setRemarks] = useState("");

  // Loading & message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // AI Assistant States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiChat, setAiChat] = useState<Array<{ sender: "user" | "atlas"; text: string }>>([
    { sender: "atlas", text: `Greetings, Placement Director. I am ATLAS, your administrative recruiter assistant. Ask me to generate campaign drafts, summarize candidate benchmarks, or compare department placement charts.` }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Administrative Overview metrics
      const ovRes = await fetch("/api/admin/overview");
      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setMetrics(ovData.counters);
        setAuditLogs(ovData.auditLogs);
      }

      // 2. Get active placement drives
      const dummyStudentId = "student_akalya"; // bypass to get full list
      const driveRes = await fetch(`/api/student/drives/${dummyStudentId}`);
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        setDrives(driveData);
        if (driveData.length > 0 && !selectedDriveId) {
          setSelectedDriveId(driveData[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching administrative dashboard data.", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedDriveId) return;
    try {
      const regRes = await fetch(`/api/officer/drive/${selectedDriveId}/registrations`);
      if (regRes.ok) {
        const regData = await regRes.json();
        setRegistrants(regData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id, activeTab]);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedDriveId, activeTab]);

  // Create placement drive
  const handleCreateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      officerId: user.id,
      companyName,
      role,
      packageLPA,
      eligibleDepts,
      minCGPA,
      maxStandingArrears,
      driveDate,
      location,
      description
    };

    try {
      const response = await fetch("/api/officer/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create drive.");

      setSuccessMsg(`Placement Drive for ${companyName} (${role}) successfully published!`);
      // Reset form
      setCompanyName("");
      setRole("");
      setPackageLPA("");
      setDriveDate("");
      setLocation("");
      setDescription("");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Delete Placement drive
  const handleDeleteDrive = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this placement drive? This action is irreversible.")) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`/api/officer/drive/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSuccessMsg("Placement drive removed successfully.");
        fetchData();
      }
    } catch (e) {
      setErrorMsg("Failed to delete drive.");
    }
  };

  // Toggle department selections in checklist
  const toggleDeptEligible = (dept: string) => {
    if (eligibleDepts.includes(dept)) {
      setEligibleDepts(eligibleDepts.filter(d => d !== dept));
    } else {
      setEligibleDepts([...eligibleDepts, dept]);
    }
  };

  // Submit applicant pipeline action updates
  const handleStatusPipelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      officerId: user.id,
      registrationId: selectedReg.id,
      status: regStatus,
      interviewSchedule,
      remarks
    };

    try {
      const response = await fetch("/api/officer/registration/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit pipeline status.");

      setSuccessMsg(`Shortlist pipeline status updated for ${selectedReg.studentName}!`);
      setSelectedReg(null);
      setInterviewSchedule("");
      setRemarks("");
      fetchRegistrations();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // ATLAS AI: General chat co-pilot
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
      }
    } catch (err) {
      setAiChat(prev => [...prev, { sender: "atlas", text: "AI pipeline latency detected. Try again shortly." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Recharts Cyber Neon Colors
  const COLORS = ["#06b6d4", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6"];

  // Mock placement stats for visualization
  const deptStatsData = [
    { name: "AI & DS", average: 22.4, rate: 94 },
    { name: "CSE", average: 18.2, rate: 88 },
    { name: "IT", average: 14.5, rate: 82 },
    { name: "ECE", average: 11.2, rate: 75 },
    { name: "EEE", average: 8.5, rate: 68 },
    { name: "Mech", average: 6.8, rate: 60 },
    { name: "Civil", average: 5.4, rate: 52 }
  ];

  const packagesDistribData = [
    { range: "30+ LPA", count: 8 },
    { range: "15-30 LPA", count: 24 },
    { range: "8-15 LPA", count: 48 },
    { range: "5-8 LPA", count: 112 },
    { range: "3-5 LPA", count: 184 }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative">
      {/* Background neon glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[150px] pointer-events-none rounded-full" />

      {/* Placement Officer Header */}
      <header className="z-20 sticky top-0 bg-slate-950/70 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Building className="animate-pulse" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              ATLAS <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">OFFICER</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">College Campus Recruiter Headquarters</p>
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
            onClick={() => setActiveTab("drives")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "drives" ? "bg-cyan-500/20 text-cyan-400 border-b border-cyan-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            MANAGE DRIVES
          </button>
          <button
            onClick={() => setActiveTab("applicants")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "applicants" ? "bg-cyan-500/20 text-cyan-400 border-b border-cyan-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            APPLICATIONS
            {registrants.filter(r => r.status === 'applied').length > 0 && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "reports" ? "bg-cyan-500/20 text-cyan-400 border-b border-cyan-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            REPORTS
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

        {/* User logout control */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-semibold text-slate-100">Placement Admin</p>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Super Administrator</p>
          </div>
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/25 hover:border-red-500/50 text-red-400 font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">
        
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-ping" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping" />
              <span className="font-bold uppercase tracking-widest">TRANSACTION LOGGED</span>
            </div>
            <p>{successMsg}</p>
          </div>
        )}

        {/* Mobile subnavigation menu */}
        <div className="flex md:hidden grid grid-cols-5 gap-1 bg-slate-900/60 p-1 border border-slate-800 rounded-xl">
          {(["overview", "drives", "applicants", "reports", "ai"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-0.5 text-[9px] rounded-lg font-mono text-center transition-all ${
                activeTab === tab ? 'bg-cyan-500/20 text-cyan-300 border-b border-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ====================================
            TAB: OVERVIEW (ANALYTICS & CHARTS)
            ==================================== */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-8">
            
            {/* Real-time counters panel */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl relative">
                <Users className="absolute top-6 right-6 text-cyan-500/20" size={32} />
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Total Enrolled Students</span>
                <span className="text-3xl font-black text-white font-mono">{metrics.students}</span>
                <div className="text-[10px] text-slate-400 font-mono mt-2">PLACED RATE: <span className="text-emerald-400">{metrics.placementRate}%</span></div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl relative">
                <Briefcase className="absolute top-6 right-6 text-purple-500/20" size={32} />
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Active Partners / Companies</span>
                <span className="text-3xl font-black text-purple-400 font-mono">{metrics.drives}</span>
                <div className="text-[10px] text-slate-400 font-mono mt-2">Drives actively hiring</div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl relative">
                <Percent className="absolute top-6 right-6 text-emerald-500/20" size={32} />
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Average Package (LPA)</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{metrics.avgPackage}</span>
                <div className="text-[10px] text-slate-400 font-mono mt-2">NATIONAL AVG: 7.2 LPA</div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl relative">
                <DollarSign className="absolute top-6 right-6 text-amber-500/20" size={32} />
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Max Offer Packages</span>
                <span className="text-3xl font-black text-amber-400 font-mono">{metrics.maxPackage}</span>
                <div className="text-[10px] text-slate-400 font-mono mt-2">ELITE CLUSTERS</div>
              </div>
            </div>

            {/* Recharts Analytics Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Department Average Packages Comparison */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 size={16} /> Department Package Analysis (LPA)
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptStatsData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px" }} />
                      <Bar dataKey="average" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Placement Ratios Percentage */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp size={16} /> Placed Ratios by Division (%)
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deptStatsData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b" }} />
                      <Area type="monotone" dataKey="rate" stroke="#a855f7" fill="rgba(168,85,247,0.1)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Audit Logs activities list */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                <Terminal size={16} /> College Security Audit logs
              </h3>

              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                      <span className="text-cyan-400 font-bold">{log.userName} ({log.role})</span> —{" "}
                      <span className="text-slate-200">{log.action}: {log.details}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 uppercase">{log.id.substring(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ====================================
            TAB: MANAGE DRIVES (BUILDER PANEL)
            ==================================== */}
        {activeTab === "drives" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Column 1 & 2: List of active drives */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">Hiring Drives Master database</h2>
              <p className="text-xs text-slate-400 mb-6">Create, modify, or terminate campus hiring drives and set precise GPA and branch conditions.</p>

              <div className="space-y-4">
                {drives.map((drive) => (
                  <div key={drive.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{drive.companyName}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">{drive.packageLPA} LPA</span>
                      </div>
                      <p className="text-xs text-purple-400 font-mono mt-1">{drive.role}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-mono">
                        <span>Min CGPA: {drive.minCGPA}</span>
                        <span>Date: {drive.driveDate}</span>
                        <span>Location: {drive.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedDriveId(drive.id)}
                        className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 cursor-pointer"
                      >
                        VIEW REGS
                      </button>
                      <button
                        onClick={() => handleDeleteDrive(drive.id)}
                        className="p-2 text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/15 rounded-lg border border-red-500/15 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Drive Publisher Form */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-4 flex items-center gap-1.5">
                <Plus size={16} /> Publish Placement Drive
              </h3>

              <form onSubmit={handleCreateDriveSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. NVIDIA, Google"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Designation / Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. SDE Intern, ML Specialist"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Compensation (LPA)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={packageLPA}
                      onChange={(e) => setPackageLPA(e.target.value)}
                      placeholder="e.g. 24.5"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Required CGPA</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={minCGPA}
                      onChange={(e) => setMinCGPA(e.target.value)}
                      placeholder="e.g. 8.0"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Arrears Allowed</label>
                    <input
                      type="number"
                      required
                      value={maxStandingArrears}
                      onChange={(e) => setMaxStandingArrears(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Evaluation Date</label>
                    <input
                      type="date"
                      required
                      value={driveDate}
                      onChange={(e) => setDriveDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Hiring Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, Hybrid"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Hiring Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Core algorithms, performance compiler optimizations..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Branch Eligibility Checklist</label>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-slate-950 border border-slate-850 rounded-xl">
                    {SUPPORTED_DEPARTMENTS.map((dept, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-[10px] text-slate-400 font-sans leading-relaxed">
                        <input
                          type="checkbox"
                          checked={eligibleDepts.includes(dept)}
                          onChange={() => toggleDeptEligible(dept)}
                          className="rounded border-slate-800 text-cyan-500"
                        />
                        <span>{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono uppercase font-bold text-xs tracking-wider cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                  PUBLISH DRIVE
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ====================================
            TAB: APPLICATIONS (SELECTION PIPELINE)
            ==================================== */}
        {activeTab === "applicants" && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Selection Pipeline / Applicants</h2>
                <p className="text-xs text-slate-400 mt-1 font-sans">Manage registration status and schedule technical interviews for candidate pools.</p>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5 text-right">Filter by Placement Drive</label>
                <select
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs font-mono text-cyan-400 focus:outline-none"
                >
                  {drives.map(d => (
                    <option key={d.id} value={d.id}>{d.companyName} ({d.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Registrations list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Applicant ID</th>
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold">Department</th>
                    <th className="p-4 font-bold text-center">CGPA</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                  {registrants.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-900/30">
                      <td className="p-4 text-cyan-500 font-semibold">{reg.id}</td>
                      <td className="p-4 text-slate-100 font-sans font-bold">{reg.studentName}</td>
                      <td className="p-4 text-slate-400 font-sans">{reg.studentDept}</td>
                      <td className="p-4 text-center text-white">{reg.studentCGPA}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded uppercase font-bold ${
                          reg.status === 'selected' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : reg.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="px-3.5 py-1 text-[11px] font-mono font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-cyan-400 cursor-pointer"
                        >
                          MANAGE PIPELINE
                        </button>
                      </td>
                    </tr>
                  ))}

                  {registrants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">No drive applicants recorded yet. Encourage students to register.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Selection pipeline form */}
        {selectedReg && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-md font-bold text-white mb-2">Update Candidate Pipeline: {selectedReg.studentName}</h3>
              <p className="text-xs text-slate-400 mb-4">Advance candidate's selection process, schedule interview slots, and post comments.</p>

              <form onSubmit={handleStatusPipelineSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Recruitment Stage</label>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                  >
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="selected">Selected (Placed)</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Interview Slot Details</label>
                  <input
                    type="text"
                    value={interviewSchedule}
                    onChange={(e) => setInterviewSchedule(e.target.value)}
                    placeholder="e.g. Technical Round 1: 2026-07-15 11:00 AM"
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Internal Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Excellent communication, robust compiler optimization portfolio..."
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReg(null)}
                    className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-xs font-mono uppercase font-bold text-slate-400 hover:bg-slate-750"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 text-xs font-mono uppercase font-bold hover:bg-cyan-400"
                  >
                    UPDATE STAGE
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================
            TAB: REPORTS (EXPORT CENTER)
            ==================================== */}
        {activeTab === "reports" && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Administrative Placement Reports</h2>
            <p className="text-xs text-slate-400 mb-6">Compile and download normalized college datasets, recruitment audit histories, and active drive statuses.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Student Database Report */}
              <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <Users className="text-cyan-400" size={24} />
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">Student Demographics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Contains names, enrollment numbers, CGPA thresholds, resume statuses, and placed records.</p>
                
                <a 
                  href="/api/reports/export/csv/students"
                  download
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  <Download size={14} /> EXPORT CSV DATA
                </a>
              </div>

              {/* Drives Database Report */}
              <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <Briefcase className="text-purple-400" size={24} />
                <h3 className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold">Recruiter Portfolio</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Contains company designations, role descriptions, compensation LPA details, and evaluation dates.</p>
                
                <a 
                  href="/api/reports/export/csv/drives"
                  download
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-purple-300 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  <Download size={14} /> EXPORT CSV DATA
                </a>
              </div>

              {/* Audit logs Report */}
              <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <Terminal className="text-emerald-400" size={24} />
                <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">Security Audit History</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Contains chronological system updates, coordinator reviews, drive registers, and logins audit trials.</p>
                
                <a 
                  href="/api/reports/export/csv/audit"
                  download
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-300 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  <Download size={14} /> EXPORT CSV DATA
                </a>
              </div>

            </div>
          </div>
        )}

        {/* ====================================
            TAB: ATLAS AI (ADMIN CO-PILOT CHAT)
            ==================================== */}
        {activeTab === "ai" && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col h-[550px] overflow-hidden max-w-4xl mx-auto">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-widest">ATLAS RECRUITMENT INSIGHTS CLIENT</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">MODEL: GEMINI 3.5 FLASH</span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {aiChat.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === "user" ? "bg-purple-500/10 border border-purple-500/20 text-purple-200" : "bg-slate-950/80 border border-slate-850 text-slate-300"
                  }`}>
                    <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1 font-bold">
                      {msg.sender === "user" ? "OFFICER (YOU)" : "ATLAS INTEL"}
                    </span>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-xs font-mono text-cyan-400 animate-pulse flex items-center gap-2">
                    <Cpu className="animate-spin" size={14} />
                    <span>ATLAS FORMULATING RECRUITER ANALYTICS...</span>
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
                placeholder="Ask ATLAS to draft outreach emails for Google recruiter campaigns, analyze department trends..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
              />
              <button type="submit" disabled={aiLoading || !aiMessage.trim()} className="p-3 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all cursor-pointer">
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
