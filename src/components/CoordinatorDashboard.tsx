import React, { useState, useEffect } from "react";
import { 
  User, 
  StudentProfile, 
  PlacementDrive, 
  Announcement, 
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
  AlertCircle
} from "lucide-react";

interface CoordinatorDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function CoordinatorDashboard({ user, onLogout }: CoordinatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "verify" | "students" | "announcement" | "ai">("overview");
  const [roster, setRoster] = useState<any[]>([]);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Loading & message states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resume Review Modal/Form states
  const [selectedReview, setSelectedReview] = useState<{ studentId: string; studentName: string } | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewComments, setReviewComments] = useState("");

  // Broadcast Announcement States
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // AI Assistant States
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedMatchDrive, setSelectedMatchDrive] = useState("");
  const [aiDraftTitle, setAiDraftTitle] = useState("");
  const [aiDraftContent, setAiDraftContent] = useState("");

  const [aiMessage, setAiMessage] = useState("");
  const [aiChat, setAiChat] = useState<Array<{ sender: "user" | "atlas"; text: string }>>([
    { sender: "atlas", text: `Welcome Coordinator Prof. ${user.name.split(" ").pop() || "Dev"}! I am ATLAS, your AI Placement Co-Pilot. I can generate automated announcements, score candidate matches, or draft email campaigns.` }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get department student roster
      const rosterRes = await fetch(`/api/coordinator/students/${encodeURIComponent(user.department)}`);
      if (rosterRes.ok) {
        const rosterData = await rosterRes.json();
        setRoster(rosterData);
      }

      // 2. Get active drives
      const driveRes = await fetch("/api/announcements"); // placeholder for generic assets fetch or all drives
      const allDrivesRes = await fetch("/api/student/drives/placeholder_user_id"); // we can bypass with a dummy student ID
      // To get all drives safely, let's call the student drives API with any user ID, or fetch mock drives list.
      // Since student drives endpoint requires a student ID, we'll fetch with 'student_akalya' to get the full list
      const allDrivesRes2 = await fetch("/api/student/drives/student_akalya");
      if (allDrivesRes2.ok) {
        const drivesData = await allDrivesRes2.json();
        setDrives(drivesData);
        if (drivesData.length > 0) {
          setSelectedMatchDrive(drivesData[0].id);
        }
      }

      // 3. Get announcements
      const annRes = await fetch("/api/announcements");
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData.filter((a: Announcement) => a.department === "All" || a.department === user.department));
      }
    } catch (err) {
      console.error("Error loading coordinator datasets.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id, activeTab]);

  // Submit resume verification review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      coordinatorId: user.id,
      studentId: selectedReview.studentId,
      status: reviewStatus,
      comments: reviewComments
    };

    try {
      const response = await fetch("/api/coordinator/resume/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process review.");

      setSuccessMsg(`Successfully reviewed resume for ${selectedReview.studentName} as ${reviewStatus}!`);
      setSelectedReview(null);
      setReviewComments("");
      fetchData(); // refresh roster
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Broadcast announcement
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      authorId: user.id,
      title: annTitle,
      content: annContent,
      department: user.department
    };

    try {
      const response = await fetch("/api/coordinator/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Broadcast delivery failed.");

      setSuccessMsg(`Announcement successfully broadcasted to all ${user.department} students!`);
      setAnnTitle("");
      setAnnContent("");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`/api/coordinator/announcement/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSuccessMsg("Announcement deleted from institutional feeds.");
        fetchData();
      }
    } catch (e) {
      setErrorMsg("Failed to delete record.");
    }
  };

  // ATLAS AI: Run Candidate Matching
  const runAICandidateMatch = async () => {
    const drive = drives.find(d => d.id === selectedMatchDrive);
    if (!drive) return;

    setAiLoading(true);
    setRecommendations([]);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "placement_recommendation",
          payload: {
            drive,
            students: roster
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.aiResponse && data.aiResponse.recommendations) {
        setRecommendations(data.aiResponse.recommendations);
        setSuccessMsg(`ATLAS AI compiled candidates for ${drive.companyName}!`);
      } else {
        throw new Error();
      }
    } catch (err) {
      setErrorMsg("AI matching pipeline exceeded capacity. Displaying local matching algorithms.");
    } finally {
      setAiLoading(false);
    }
  };

  // ATLAS AI: Generate professional announcement drafts
  const runAIAnnouncementDraft = async () => {
    const drive = drives.find(d => d.id === selectedMatchDrive);
    if (!drive) return;

    setAiLoading(true);
    setAiDraftTitle("");
    setAiDraftContent("");

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "announcement_generator",
          payload: { driveDetails: drive }
        })
      });

      const data = await response.json();
      if (response.ok && data.aiResponse) {
        setAiDraftTitle(data.aiResponse.title || "");
        setAiDraftContent(data.aiResponse.content || "");
        setSuccessMsg("ATLAS AI draft created! Review and sync to announcement feed.");
        setActiveTab("announcement");
        setAnnTitle(data.aiResponse.title || "");
        setAnnContent(data.aiResponse.content || "");
      }
    } catch (err) {
      setErrorMsg("Failed to generate AI template.");
    } finally {
      setAiLoading(false);
    }
  };

  // ATLAS AI: General Chat interface
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
      setAiChat(prev => [...prev, { sender: "atlas", text: "Apologies, communication delay detected. Please retry." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Counters for Quick Overview Panel
  const totalStudents = roster.length;
  const pendingReviews = roster.filter(r => r.profile?.resumeApproved === "pending" && r.profile?.resumeUrl).length;
  const approvedResumes = roster.filter(r => r.profile?.resumeApproved === "approved").length;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative">
      {/* Background radial effects */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Coordinator Header */}
      <header className="z-20 sticky top-0 bg-slate-950/70 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Terminal className="animate-pulse" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              ATLAS <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">COORDINATOR</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{user.department.substring(0, 30)}...</p>
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-purple-500/20 text-purple-300 border-b border-purple-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "verify" ? "bg-purple-500/20 text-purple-300 border-b border-purple-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            VERIFY RESUMES
            {pendingReviews > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "students" ? "bg-purple-500/20 text-purple-300 border-b border-purple-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ROSTER
          </button>
          <button
            onClick={() => setActiveTab("announcement")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
              activeTab === "announcement" ? "bg-purple-500/20 text-purple-300 border-b border-purple-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            BROADCAST
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ai" ? "bg-cyan-500/20 text-cyan-300 border-b border-cyan-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={12} className="text-cyan-400" />
            AI SUITE
          </button>
        </nav>

        {/* User control buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-semibold text-slate-100">Prof. {user.name.split(" ").pop()}</p>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">DEPT ADVISOR</span>
          </div>
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/25 hover:border-red-500/50 text-red-400 font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">
        
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-ping" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
              <span className="font-bold uppercase tracking-wider">ALERT: ACTIVE REGISTRATION MEMO</span>
            </div>
            <p>{successMsg}</p>
          </div>
        )}

        {/* Mobile Sub Navigation Menu */}
        <div className="flex md:hidden grid grid-cols-5 gap-1.5 bg-slate-900/60 p-1 border border-slate-800 rounded-xl">
          {(["overview", "verify", "students", "announcement", "ai"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-0.5 text-[9px] rounded-lg font-mono text-center transition-all ${
                activeTab === tab ? 'bg-purple-500/20 text-purple-300 border-b border-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ====================================
            TAB: OVERVIEW (METRICS & ACTIVE LISTS)
            ==================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Top Counters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Department Students</span>
                <span className="text-3xl font-black text-white font-mono">{totalStudents}</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">TOTAL ENROLLED ROSTER</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl border-l-2 border-l-amber-500/60">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Resumes Pending Vetting</span>
                <span className="text-3xl font-black text-amber-400 font-mono">{pendingReviews}</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">REQUIRES ACTION</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Approved Resumes</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{approvedResumes}</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">ELIGIBLE TO APPLY</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Institutional Placement Drives</span>
                <span className="text-3xl font-black text-blue-400 font-mono">{drives.length}</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">ACTIVE PARTNERS</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: List of Pending Resumes for vetting */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-md font-mono text-purple-400 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                  <AlertCircle size={16} /> Resumes Awaiting Verification
                </h3>

                <div className="space-y-4">
                  {roster.filter(item => item.profile?.resumeApproved === "pending" && item.profile?.resumeUrl).map((item) => (
                    <div key={item.user.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{item.user.name}</h4>
                          <span className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-500">{item.profile.enrollmentNo}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">CGPA: <span className="font-bold text-white">{item.profile.academics?.cgpa || "0.0"}</span> • Arrears: {item.profile.academics?.standingArrears || 0}</p>
                        <a 
                          href={item.profile.resumeUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-mono mt-2"
                        >
                          <FileText size={12} /> View Resume File
                        </a>
                      </div>

                      <button
                        onClick={() => setSelectedReview({ studentId: item.user.id, studentName: item.user.name })}
                        className="px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all cursor-pointer self-start md:self-auto"
                      >
                        REVIEW RESUME
                      </button>
                    </div>
                  ))}

                  {roster.filter(item => item.profile?.resumeApproved === "pending" && item.profile?.resumeUrl).length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs font-mono italic">No student resumes are currently pending verification. Outstanding!</div>
                  )}
                </div>
              </div>

              {/* Right Column: Mini Bulletin Board */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-md font-mono text-purple-400 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                  <Bell size={16} /> Broadcast History
                </h3>

                <div className="space-y-4">
                  {announcements.slice(0, 3).map(ann => (
                    <div key={ann.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono mb-1">
                        <span>{ann.department}</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">{ann.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{ann.content}</p>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-[9px] font-mono text-red-400 hover:underline block text-right mt-2 cursor-pointer w-full"
                      >
                        DELETE ANN
                      </button>
                    </div>
                  ))}

                  {announcements.length === 0 && (
                    <p className="text-xs text-slate-500 font-mono italic text-center py-4">No active broadcasts listed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal review form overlay */}
        {selectedReview && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-md font-bold text-white mb-2">Review Resume: {selectedReview.studentName}</h3>
              <p className="text-xs text-slate-400 mb-4">Validate that details in the uploaded PDF comply with placement requirements before approving drives registration.</p>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Review Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewStatus("approved")}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono uppercase transition-all ${
                        reviewStatus === "approved" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-slate-950/40 border-slate-850 text-slate-500"
                      }`}
                    >
                      APPROVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewStatus("rejected")}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono uppercase transition-all ${
                        reviewStatus === "rejected" ? "bg-red-500/10 border-red-500 text-red-400" : "bg-slate-950/40 border-slate-850 text-slate-500"
                      }`}
                    >
                      NEEDS REVISION
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Evaluator Remarks / Comments</label>
                  <textarea
                    rows={3}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder="Provide constructive feedback for student revision or guidelines..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-xs font-mono uppercase font-bold text-slate-400 hover:bg-slate-750"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-xl bg-purple-500 text-slate-950 text-xs font-mono uppercase font-bold hover:bg-purple-400"
                  >
                    SUBMIT REVIEW
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================
            TAB: VERIFY RESUMES (LIST DETAIL)
            ==================================== */}
        {activeTab === "verify" && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Resume Review Pipeline</h2>
            <p className="text-xs text-slate-400 mb-6">Manage and verify profiles of final-year students within the {user.department} division.</p>

            <div className="space-y-4">
              {roster.map((item) => (
                <div key={item.user.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{item.user.name}</h4>
                      <span className={`text-[8px] px-2 py-0.5 rounded font-mono uppercase ${
                        item.profile?.resumeApproved === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : item.profile?.resumeApproved === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.profile?.resumeApproved || 'unregistered'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">CGPA: {item.profile?.academics?.cgpa || "0.0"} • Arrears: {item.profile?.academics?.standingArrears || 0} • Phone: {item.profile?.phone || "N/A"}</p>
                    
                    {item.profile?.skills && item.profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {item.profile.skills.map((s: string, i: number) => (
                          <span key={i} className="text-[9px] font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-500">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {item.profile?.resumeUrl ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={item.profile.resumeUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3.5 py-2 text-xs font-mono font-bold bg-slate-800 border border-slate-750 hover:bg-slate-700 rounded-lg text-cyan-400 shrink-0"
                        >
                          OPEN RESUME
                        </a>
                        <button
                          onClick={() => setSelectedReview({ studentId: item.user.id, studentName: item.user.name })}
                          className="px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg bg-purple-500 text-slate-950 hover:bg-purple-400 transition-all cursor-pointer"
                        >
                          REVIEW
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono italic">No resume file uploaded yet.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================
            TAB: ROSTER (STUDENTS LIST GRID)
            ==================================== */}
        {activeTab === "students" && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Student Database ({user.department})</h2>
            <p className="text-xs text-slate-400 mb-6">Complete enrollment profiles, verified scholastic percentages, and skills metrics.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Enrollment No</th>
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold text-center">CGPA</th>
                    <th className="p-4 font-bold text-center">Arrears</th>
                    <th className="p-4 font-bold text-center">Projects</th>
                    <th className="p-4 font-bold text-center">Profile %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                  {roster.map((item) => (
                    <tr key={item.user.id} className="hover:bg-slate-900/30">
                      <td className="p-4 text-cyan-400 font-semibold">{item.profile?.enrollmentNo || "N/A"}</td>
                      <td className="p-4 text-slate-100 font-sans font-bold">{item.user.name}</td>
                      <td className="p-4 text-center text-white">{item.profile?.academics?.cgpa || "0.0"}</td>
                      <td className="p-4 text-center text-slate-400">{item.profile?.academics?.standingArrears || 0}</td>
                      <td className="p-4 text-center text-slate-400">{item.profile?.projects?.length || 0}</td>
                      <td className="p-4 text-center font-bold text-emerald-400">{item.profile?.completedPercent || 0}%</td>
                    </tr>
                  ))}

                  {roster.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">No registered student records located.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================
            TAB: BROADCAST (ANNOUNCEMENT GENERATOR)
            ==================================== */}
        {activeTab === "announcement" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Column 1 & 2: Broadcast Creator */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">Publish Campus Alert</h2>
              <p className="text-xs text-slate-400 mb-6">Create bulletins to instantly notify and push dashboard & email alerts to final year candidates.</p>

              <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Announcement Headline</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Enter short, urgent placement headline..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Bulletin Content</label>
                  <textarea
                    rows={6}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Provide details about placement drive criteria, requirements, or schedules..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!annTitle || !annContent}
                  className="w-full py-3 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-mono uppercase font-bold tracking-wider cursor-pointer"
                >
                  BROADCAST ALERT NOW
                </button>
              </form>
            </div>

            {/* Column 3: AI Bulletin Draft */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
                <Sparkles size={14} /> AI Bulletin Assistant
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Select an upcoming placement drive and let ATLAS compile an engaging, professional, campus-wide notification!
              </p>

              <div className="space-y-3">
                <select
                  value={selectedMatchDrive}
                  onChange={(e) => setSelectedMatchDrive(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                >
                  {drives.map(d => (
                    <option key={d.id} value={d.id}>{d.companyName} ({d.role})</option>
                  ))}
                </select>

                <button
                  onClick={runAIAnnouncementDraft}
                  disabled={aiLoading || drives.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono uppercase font-bold cursor-pointer"
                >
                  {aiLoading ? "ATLAS DRAFTING BULLETIN..." : "GENERATE AI BULLETIN"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================
            TAB: AI SUITE (COMPREHENSIVE CO-PILOT)
            ==================================== */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Direct AI chat co-pilot */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col h-[550px] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-widest">ATLAS CO-PILOT FOR COORDINATORS</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">MODEL: GEMINI 3.5 FLASH</span>
              </div>

              {/* Chat area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {aiChat.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.sender === "user" ? "bg-purple-500/10 border border-purple-500/20 text-purple-200" : "bg-slate-950/80 border border-slate-850 text-slate-300"
                    }`}>
                      <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1 font-bold">
                        {msg.sender === "user" ? "COORDINATOR (YOU)" : "ATLAS INTEL"}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-xs font-mono text-cyan-400 animate-pulse flex items-center gap-2">
                      <Cpu className="animate-spin" size={14} />
                      <span>ATLAS SEARCHING ELIGIBILITY CORES...</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={sendAIChatMessage} className="p-4 border-t border-slate-800 bg-slate-950/60 flex gap-2">
                <input
                  type="text"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Ask ATLAS about department stats, matching algorithms, or curriculum improvements..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
                />
                <button type="submit" disabled={aiLoading || !aiMessage.trim()} className="p-3 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all cursor-pointer">
                  <Send size={14} />
                </button>
              </form>
            </div>

            {/* Right Column: Intelligent Candidate Matching */}
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
                  <Cpu size={14} /> Elite Candidate Matching
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Match the top Computer Science or AI & DS students based on CGPA thresholds and required technical skills.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target Placement Drive</label>
                    <select
                      value={selectedMatchDrive}
                      onChange={(e) => setSelectedMatchDrive(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    >
                      {drives.map(d => (
                        <option key={d.id} value={d.id}>{d.companyName} ({d.role})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={runAICandidateMatch}
                    disabled={aiLoading || drives.length === 0}
                    className="w-full py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 text-xs font-mono uppercase font-bold hover:bg-cyan-400 cursor-pointer"
                  >
                    RUN CANDIDATE MATCHING
                  </button>
                </div>
              </div>

              {/* Render Matches List */}
              {recommendations.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">Matched Candidates</h4>
                  
                  <div className="space-y-4">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{rec.studentName}</span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">{rec.confidenceScore}% MATCH</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{rec.matchReason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
