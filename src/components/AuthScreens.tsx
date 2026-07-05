import React, { useState } from "react";
import { 
  Shield, 
  User as UserIcon, 
  Mail, 
  Lock, 
  ArrowRight, 
  Terminal, 
  Sparkles,
  BookOpen
} from "lucide-react";
import { UserRole, User, SUPPORTED_DEPARTMENTS } from "../types";

interface AuthScreensProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function AuthScreens({ onLoginSuccess }: AuthScreensProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");
  const [role, setRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState(SUPPORTED_DEPARTMENTS[0]);
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [debugOTP, setDebugOTP] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email || !password || !name) {
      setError("Please complete all fields to register.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, name, department })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setOtpSent(true);
      setSuccessMsg("Account pre-registered! An OTP code has been generated.");
      if (data.debugOTP) {
        setDebugOTP(data.debugOTP);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!otpCode) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setSuccessMsg("Verification successful! Redirecting to login portal...");
      setTimeout(() => {
        setOtpSent(false);
        setOtpCode("");
        setDebugOTP(null);
        setActiveTab("login");
        setPassword("");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Reset request failed.");
      }

      setSuccessMsg(`A temporary verification code has been dispatched. Use OTP ${data.debugOTP} to sign back in.`);
      if (data.debugOTP) {
        setDebugOTP(data.debugOTP);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Visual background grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_40%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Brand Header */}
      <div className="z-10 text-center mb-8">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 animate-pulse">
          <Terminal size={16} />
          <span className="text-xs font-mono tracking-widest font-semibold uppercase">SYSTEM CONNECTIVITY: SECURE</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
          ATLAS
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-2 uppercase tracking-wider">
          AI-Driven Placement Coordinator Hub
        </p>
      </div>

      {/* Main Glassmorphism Form container */}
      <div className="w-full max-w-lg z-10 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.05)] overflow-hidden">
        {/* Card Header Selector Tabs (Only show if not in OTP mode) */}
        {!otpSent && (
          <div className="flex border-b border-slate-800/80 bg-slate-950/40">
            <button
              onClick={() => { setActiveTab("login"); resetMessages(); }}
              className={`flex-1 py-4 text-sm font-mono tracking-wider font-semibold transition-all duration-300 ${
                activeTab === "login" 
                  ? "text-cyan-400 border-b-2 border-cyan-500 bg-slate-900/40" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              LOG IN
            </button>
            <button
              onClick={() => { setActiveTab("register"); resetMessages(); }}
              className={`flex-1 py-4 text-sm font-mono tracking-wider font-semibold transition-all duration-300 ${
                activeTab === "register" 
                  ? "text-purple-400 border-b-2 border-purple-500 bg-slate-900/40" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              REGISTER
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="font-bold uppercase tracking-wider">ALERT: ACTIVE SYSTEM BROADCAST</span>
              </div>
              <p>{successMsg}</p>
              {debugOTP && (
                <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-center font-bold text-sm text-cyan-300 tracking-widest font-mono">
                  OTP CODE: {debugOTP}
                </div>
              )}
            </div>
          )}

          {/* OTP Verification Page */}
          {otpSent ? (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-100 mb-1">Verify Email</h3>
                <p className="text-xs text-slate-400">Enter the security verification code dispatched to <span className="text-cyan-400 font-semibold">{email}</span></p>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2 tracking-wider">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono placeholder:text-slate-700 placeholder:tracking-normal"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer"
              >
                {loading ? "AUTHENTICATING..." : "VERIFY SECURITY OTP"}
                <Shield size={16} />
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); resetMessages(); }}
                  className="text-xs font-mono text-slate-500 hover:text-slate-300 underline"
                >
                  Cancel and update registration details
                </button>
              </div>
            </form>
          ) : activeTab === "login" ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2 tracking-wider">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Secure Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("forgot")}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono uppercase tracking-wider"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all cursor-pointer mt-2"
              >
                {loading ? "INITIALIZING SECURE LINK..." : "SECURE SYSTEM SIGN IN"}
                <ArrowRight size={16} />
              </button>
              
              <div className="mt-4 p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-center text-[11px] text-slate-400 font-mono">
                <span className="text-cyan-400">PRO-TIP:</span> Login with <span className="text-purple-400">akalyaus@gmail.com</span> for instant student access.
              </div>
            </form>
          ) : activeTab === "register" ? (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 tracking-wider">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Akalya S"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 tracking-wider">
                  Select System Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["student", "coordinator", "officer"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono uppercase tracking-wider transition-all ${
                        role === r
                          ? "bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                          : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      {r === "officer" ? "Officer" : r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 tracking-wider">
                  Department Affiliation
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
                  >
                    {SUPPORTED_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-slate-950 text-slate-100 text-xs">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 tracking-wider">
                  Contact Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@college.edu"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 tracking-wider">
                  Create Security Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all cursor-pointer mt-2"
              >
                {loading ? "TRANSMITTING DATA..." : "INITIATE ACCOUNT REGISTRATION"}
                <Sparkles size={16} />
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-md font-bold text-slate-100">Recover Credentials</h3>
                <p className="text-xs text-slate-400 mt-1">Provide your registered email. Our database will broadcast a login validation link immediately.</p>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2 tracking-wider">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@college.edu"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
              >
                {loading ? "COMMUNICATING WITH SATELLITE..." : "BROADCAST PASSWORD RECOVERY"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setActiveTab("login"); resetMessages(); }}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200 uppercase tracking-widest font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Security notice footer */}
      <div className="mt-8 z-10 flex items-center gap-2 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
        <Shield size={12} className="text-cyan-500/40" />
        <span>AES-256 SECURED ENVIRONMENT</span>
      </div>
    </div>
  );
}
