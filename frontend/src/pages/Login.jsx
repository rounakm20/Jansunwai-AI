import React, { useState } from "react";
import { Landmark, Cpu, User, ShieldCheck, Eye, EyeOff, Phone, Lock, BadgeCheck, ArrowRight, AlertCircle } from "lucide-react";

// ──────────────────────────────────────────────
// DEMO CREDENTIALS (replace with real auth API)
// Citizen  → any name + 10-digit mobile
// Officer  → employee ID: UP-ADM-001  password: admin@123
// ──────────────────────────────────────────────
const OFFICER_CREDENTIALS = {
  "UP-ADM-001": "admin@123",
  "UP-ADM-002": "officer@456",
};

export default function Login({ onLogin }) {
  const [role, setRole] = useState("citizen"); // "citizen" | "officer"
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Citizen fields
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");

  // Officer fields
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800)); // simulate network

    if (role === "citizen") {
      if (!citizenName.trim()) {
        setError("Apna naam daalein.");
        setLoading(false);
        return;
      }
      if (!/^[6-9]\d{9}$/.test(citizenPhone)) {
        setError("Valid 10-digit mobile number daalein.");
        setLoading(false);
        return;
      }
      onLogin({ role: "citizen", name: citizenName.trim(), phone: citizenPhone });
    } else {
      if (!empId.trim() || !password.trim()) {
        setError("Employee ID aur password daalein.");
        setLoading(false);
        return;
      }
      if (OFFICER_CREDENTIALS[empId.toUpperCase()] !== password) {
        setError("Employee ID ya password galat hai.");
        setLoading(false);
        return;
      }
      onLogin({ role: "officer", empId: empId.toUpperCase(), name: "Grievance Officer" });
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #EBF3FA 0%, #F5F8FA 50%, #EAF0F6 100%)" }}
    >
      {/* Tricolor stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />

      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gov-primary to-gov-secondary flex items-center justify-center shadow-md shadow-gov-primary/10">
            <Landmark className="w-5 h-5 text-gov-gold" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-gov-primary flex items-center">
              Jansunwai AI
              <span className="ml-1.5 px-2 py-0.5 bg-gov-secondary/15 rounded-full text-[9px] font-black text-gov-secondary flex items-center border border-gov-secondary/20">
                <Cpu className="w-2.5 h-2.5 mr-0.5 animate-pulse" />
                UP-GRID V2
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5 block">
              AI-Powered Grievance Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/60 overflow-hidden">

            {/* Card header */}
            <div className="bg-gov-primary px-8 pt-8 pb-6">
              <p className="text-gov-gold text-xs font-black uppercase tracking-widest mb-1">
                Uttar Pradesh Sarkar
              </p>
              <h1 className="text-white text-xl font-black">
                Jansunwai Portal Login
              </h1>
              <p className="text-slate-300 text-xs mt-1 font-medium">
                Apni bhoomika chunein aur aage badhein
              </p>
            </div>

            {/* Role toggle */}
            <div className="px-8 pt-6">
              <div className="flex bg-slate-100 rounded-xl p-1.5 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => { setRole("citizen"); setError(""); }}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                    role === "citizen"
                      ? "bg-white text-gov-primary shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Nagarik (Citizen)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setRole("officer"); setError(""); }}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                    role === "officer"
                      ? "bg-white text-gov-primary shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Adhikari (Officer)</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="px-8 py-6 space-y-4">

              {role === "citizen" ? (
                <>
                  {/* Citizen: Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Poora Naam
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Jaise: Ramesh Kumar Singh"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-gov-secondary/30 focus:border-gov-secondary transition-all"
                      />
                    </div>
                  </div>

                  {/* Citizen: Mobile */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={citizenPhone}
                        onChange={(e) => setCitizenPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-gov-secondary/30 focus:border-gov-secondary transition-all"
                      />
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="bg-gov-secondary/8 border border-gov-secondary/20 rounded-xl px-4 py-3 flex items-start space-x-2.5">
                    <BadgeCheck className="w-4 h-4 text-gov-secondary mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 font-medium">
                      Nagarik ke roop mein aap shikayat darz kar sakte hain aur apni ticket track kar sakte hain.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Officer: Employee ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Employee ID
                    </label>
                    <div className="relative">
                      <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Jaise: UP-ADM-001"
                        value={empId}
                        onChange={(e) => setEmpId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-gov-secondary/30 focus:border-gov-secondary transition-all"
                      />
                    </div>
                  </div>

                  {/* Officer: Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-gov-secondary/30 focus:border-gov-secondary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Demo hint */}
                  <div className="bg-gov-gold/10 border border-gov-gold/30 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-amber-700 mb-1">Demo Credentials</p>
                    <p className="text-xs text-amber-600 font-mono">ID: UP-ADM-001 &nbsp;|&nbsp; Pass: admin@123</p>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gov-primary hover:bg-gov-primary/90 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-md shadow-gov-primary/20 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm">Verifying...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">
                      {role === "citizen" ? "Portal Mein Pravesh Karein" : "Admin Panel Kholein"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-400 mt-5 font-medium">
            Uttar Pradesh Government · Grievance Redressal System · Powered by Jansunwai AI
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-gov-secondary" />
            <span>Government of Uttar Pradesh Grievance Ingestion Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
