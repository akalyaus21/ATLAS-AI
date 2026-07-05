import React, { useState, useEffect } from "react";
import { User } from "./types";
import AuthScreens from "./components/AuthScreens";
import StudentDashboard from "./components/StudentDashboard";
import CoordinatorDashboard from "./components/CoordinatorDashboard";
import OfficerDashboard from "./components/OfficerDashboard";
import { Cpu } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user credentials exist in local storage on load
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem("atlas_user");
      const storedToken = localStorage.getItem("atlas_token");

      if (storedUser && storedToken) {
        try {
          // Validate token with back-end session verification
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${storedToken}`
            },
            body: JSON.stringify({ user: JSON.parse(storedUser) })
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token expired or invalid, purge session keys
            localStorage.removeItem("atlas_user");
            localStorage.removeItem("atlas_token");
          }
        } catch (e) {
          console.error("Back-end authorization synchronization interrupted.", e);
        }
      }
      setCheckingAuth(false);
    };

    checkSession();
  }, []);

  // Handle clean login callbacks
  const handleLoginSuccess = (authenticatedUser: User, token: string) => {
    localStorage.setItem("atlas_user", JSON.stringify(authenticatedUser));
    localStorage.setItem("atlas_token", token);
    setUser(authenticatedUser);
  };

  // Handle clean logout callbacks
  const handleLogout = () => {
    localStorage.removeItem("atlas_user");
    localStorage.removeItem("atlas_token");
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="animate-spin-slow text-cyan-400" size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans text-center">ATLAS</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase text-center mt-1">Initializing Security Core...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render the Cyber Neon Auth entry page
  if (!user) {
    return <AuthScreens onLoginSuccess={handleLoginSuccess} />;
  }

  // Redirect to correct dashboard based on role
  switch (user.role) {
    case "student":
      return <StudentDashboard user={user} onLogout={handleLogout} />;
    case "coordinator":
      return <CoordinatorDashboard user={user} onLogout={handleLogout} />;
    case "officer":
      return <OfficerDashboard user={user} onLogout={handleLogout} />;
    default:
      return (
        <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-sm">
            <h2 className="text-white font-bold">Invalid Security Scope</h2>
            <p className="text-xs text-slate-400 mt-2">The security scope bound to this credential token is unrecognized.</p>
            <button 
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-red-500 text-xs font-mono text-white rounded-xl hover:bg-red-400"
            >
              PURGE TOKEN
            </button>
          </div>
        </div>
      );
  }
}
