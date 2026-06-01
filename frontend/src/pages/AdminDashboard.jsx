import React, { useState, useEffect } from "react";
import { 
  BarChart3, RefreshCw, Search, SlidersHorizontal, AlertTriangle, 
  CheckCircle2, Clock, Hourglass, ShieldAlert, Cpu, Eye, ArrowRight,
  Crown, Trash2, Droplets, Zap, HardHat, HeartPulse, Building2, Lock, LogOut, ShieldCheck
} from "lucide-react";
import { getComplaints, getStats, simulateTick } from "../services/api";

const DEPARTMENTS_LIST = [
  {
    id: "All",
    name: "Super Admin (All Desks)",
    tag: "Director General Desk",
    desc: "Oversee all departments, monitor global analytics, and route escalations.",
    icon: "Crown",
    color: "from-amber-500 to-yellow-600",
    textClass: "text-amber-600",
    bgClass: "bg-amber-50/50"
  },
  {
    id: "Sanitation",
    name: "Municipal Solid Waste & Sanitation Division",
    tag: "Sanitation Desk",
    desc: "Manage garbage dumps, sewer overflows, public waste, and local cleanup.",
    icon: "Trash2",
    color: "from-emerald-500 to-green-600",
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-50/50"
  },
  {
    id: "Water Supply",
    name: "Jal Sansthan (Water Board)",
    tag: "Water Board Desk",
    desc: "Monitor tap water contamination, pipeline leaks, and supply timetables.",
    icon: "Droplets",
    color: "from-blue-500 to-indigo-600",
    textClass: "text-blue-600",
    bgClass: "bg-blue-50/50"
  },
  {
    id: "Electricity",
    name: "State Electricity Distribution Corporation (UPPCL)",
    tag: "UPPCL Desk",
    desc: "Handle transformer blasts, loose wire hazards, and street light reports.",
    icon: "Zap",
    color: "from-orange-500 to-amber-600",
    textClass: "text-orange-600",
    bgClass: "bg-orange-50/50"
  },
  {
    id: "Roads",
    name: "Public Works Department (PWD)",
    tag: "PWD Roads Desk",
    desc: "Track pothole fixes, flyover repairs, and road resurfacing approvals.",
    icon: "HardHat",
    color: "from-slate-600 to-slate-800",
    textClass: "text-slate-700",
    bgClass: "bg-slate-50/50"
  },
  {
    id: "Health",
    name: "Chief Medical Officer (CMO) Office",
    tag: "CMO Health Desk",
    desc: "Address dengue outbreaks, clinic shortages, and ambulance services.",
    icon: "HeartPulse",
    color: "from-red-500 to-pink-600",
    textClass: "text-red-600",
    bgClass: "bg-red-50/50"
  },
  {
    id: "Public Safety",
    name: "Local Police & Traffic Control",
    tag: "Police & Safety Desk",
    desc: "Oversight on public safety hazards, traffic snarls, and petty crime hotlines.",
    icon: "ShieldAlert",
    color: "from-violet-500 to-purple-600",
    textClass: "text-violet-600",
    bgClass: "bg-violet-50/50"
  },
  {
    id: "Other",
    name: "General Administration Department",
    tag: "General Admin Desk",
    desc: "Direct administrative questions, miscellaneous requests, and civil issues.",
    icon: "Building2",
    color: "from-cyan-500 to-teal-600",
    textClass: "text-teal-600",
    bgClass: "bg-cyan-50/50"
  }
];

const getIconComponent = (iconName, className) => {
  switch (iconName) {
    case "Crown": return <Crown className={className} />;
    case "Trash2": return <Trash2 className={className} />;
    case "Droplets": return <Droplets className={className} />;
    case "Zap": return <Zap className={className} />;
    case "HardHat": return <HardHat className={className} />;
    case "HeartPulse": return <HeartPulse className={className} />;
    case "ShieldAlert": return <ShieldAlert className={className} />;
    case "Building2": return <Building2 className={className} />;
    default: return <Building2 className={className} />;
  }
};

export default function AdminDashboard({ onSelectComplaint }) {
  // Session authentication states
  const [loggedInDept, setLoggedInDept] = useState(null); 
  const [loginDept, setLoginDept] = useState("All"); 
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [loginError, setLoginError] = useState("");

  // Data states
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  
  // Filters state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("");

  const handleDeptSelect = (deptId) => {
    setLoginDept(deptId);
    if (deptId === "All") {
      setUsername("admin");
      setPassword("admin");
    } else {
      setUsername("officer");
      setPassword("officer");
    }
    setLoginError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password.");
      return;
    }
    
    // Simple mock authentication rules for the hackathon
    const isSuperAdmin = loginDept === "All" && username === "admin" && password === "admin";
    const isDeptOfficer = loginDept !== "All" && (username === "officer" || username === "admin") && (password === "officer" || password === "admin" || password === "password");

    if (isSuperAdmin) {
      setLoggedInDept("All");
      setSelectedDeptFilter("");
      setLoginError("");
    } else if (isDeptOfficer) {
      const selectedDeptObj = DEPARTMENTS_LIST.find(d => d.id === loginDept);
      setLoggedInDept(selectedDeptObj.name);
      setLoginError("");
    } else {
      setLoginError(
        loginDept === "All" 
          ? "Invalid Super Admin credentials. Use 'admin' / 'admin'."
          : "Invalid Department Officer credentials. Use 'officer' / 'officer'."
      );
    }
  };

  const handleLogout = () => {
    setLoggedInDept(null);
    setComplaints([]);
    setStats(null);
    setSearch("");
    setCategory("");
    setStatus("");
    setPriority("");
    setSelectedDeptFilter("");
    // Reset to default login
    setLoginDept("All");
    setUsername("admin");
    setPassword("admin");
    setLoginError("");
  };

  const loadData = async () => {
    if (!loggedInDept) return;
    setLoading(true);
    try {
      // Determine what department filter to pass to backend
      const activeDeptFilter = loggedInDept === "All" ? selectedDeptFilter : loggedInDept;
      
      const data = await getComplaints({ 
        search, 
        category, 
        status, 
        priority, 
        department: activeDeptFilter 
      });
      
      const statData = await getStats(activeDeptFilter);
      setComplaints(data);
      setStats(statData);
    } catch (err) {
      console.error("Error loading admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInDept) {
      loadData();
    }
  }, [loggedInDept, search, category, status, priority, selectedDeptFilter]);

  const handleSimulateTick = async () => {
    setSimulating(true);
    try {
      const res = await simulateTick();
      alert(`Simulation Triggered!\n${res.message}\nEscalated: ${res.escalated_count} tickets.`);
      loadData();
    } catch (err) {
      alert("Error running simulation script.");
    } finally {
      setSimulating(false);
    }
  };

  const getPriorityColor = (prio) => {
    const colors = {
      High: "bg-red-50 text-red-700 border-red-100",
      Medium: "bg-amber-50 text-amber-700 border-amber-100",
      Low: "bg-slate-50 text-slate-700 border-slate-100"
    };
    return colors[prio] || "bg-slate-100 text-slate-700";
  };

  const getStatusColor = (stat) => {
    const colors = {
      Submitted: "bg-blue-50 text-blue-700 border-blue-100",
      Assigned: "bg-purple-50 text-purple-700 border-purple-100",
      "In Progress": "bg-yellow-50 text-yellow-700 border-yellow-100",
      Escalated: "bg-red-500 text-white border-red-500 animate-pulse-slow",
      Resolved: "bg-green-50 text-green-700 border-green-100"
    };
    return colors[stat] || "bg-slate-100 text-slate-700";
  };

  // ----------------------------------------------------
  // LOGIN SCREEN RENDER
  // ----------------------------------------------------
  if (!loggedInDept) {
    const activeDeptObj = DEPARTMENTS_LIST.find(d => d.id === loginDept);
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-4 animate-slide-up">
        {/* Tricolor Header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-white to-green-600" />
          <h2 className="text-2xl font-black text-gov-dark tracking-tight uppercase flex items-center justify-center gap-2">
            <Lock className="w-5.5 h-5.5 text-gov-gold" />
            Official Administrative Login
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold uppercase tracking-wider">
            Government of Uttar Pradesh Grievance Monitoring Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Department selector list (Left Columns) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest block pl-1">
              Select Department Desk / Command Center
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DEPARTMENTS_LIST.map((dept) => {
                const isSelected = loginDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    onClick={() => handleDeptSelect(dept.id)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-32 hover:scale-[1.01] hover:shadow-md ${
                      isSelected 
                        ? "border-gov-secondary bg-white ring-2 ring-gov-secondary/15" 
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    {/* Background tint on selection */}
                    {isSelected && (
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-20 bg-gradient-to-br ${dept.color}`} />
                    )}

                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${dept.color} shadow-sm`}>
                        {getIconComponent(dept.icon, "w-4.5 h-4.5")}
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold block uppercase tracking-wide ${dept.textClass}`}>
                          {dept.tag}
                        </span>
                        <h4 className="text-xs font-black text-gov-dark leading-tight line-clamp-1 mt-0.5">
                          {dept.name}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold line-clamp-2 leading-relaxed">
                      {dept.desc}
                    </p>

                    {isSelected && (
                      <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-gov-secondary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secure Login input form (Right Column) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest block pl-1">
              Provide Credentials
            </h3>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-5 relative overflow-hidden">
              <div className="text-center pb-2 border-b">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Selected link</span>
                <span className={`text-xs font-black block mt-1 uppercase ${activeDeptObj.textClass}`}>
                  {activeDeptObj.tag} Link
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                    Security Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-secondary/30 focus:border-gov-secondary bg-slate-50/50"
                    placeholder="Username"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-secondary/30 focus:border-gov-secondary bg-slate-50/50"
                    placeholder="Password"
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-[10px] text-red-700 leading-normal">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${activeDeptObj.color} hover:scale-[1.01]`}
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Enter Control Desk</span>
                </button>
              </form>

              <div className="pt-2.5 border-t border-dashed text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Demo Credentials</span>
                <span className="text-[10px] font-mono text-slate-500 block mt-1">
                  {loginDept === "All" ? (
                    <>Username: <strong className="text-gov-secondary">admin</strong> | Pass: <strong className="text-gov-secondary">admin</strong></>
                  ) : (
                    <>Username: <strong className="text-gov-secondary">officer</strong> | Pass: <strong className="text-gov-secondary">officer</strong></>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN DASHBOARD PANEL RENDER
  // ----------------------------------------------------
  const currentDeptDetails = DEPARTMENTS_LIST.find(
    d => d.name === loggedInDept || (loggedInDept === "All" && d.id === "All")
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Welcome Panel */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Decorative strip matching active department colors */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${currentDeptDetails.color}`} />
        
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr ${currentDeptDetails.color} shadow-md`}>
            {getIconComponent(currentDeptDetails.icon, "w-6 h-6")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gov-primary tracking-tight">
                {loggedInDept === "All" ? "Director General Control Desk" : "Departmental Operations Desk"}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border flex items-center gap-1 ${currentDeptDetails.textClass} ${currentDeptDetails.bgClass}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {currentDeptDetails.tag}
              </span>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 line-clamp-1">
              {loggedInDept === "All" 
                ? "Unified Real-Time Grievance Oversight Panel & Escalation Desk"
                : `Logged in Desk: ${loggedInDept}`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleSimulateTick}
            disabled={simulating}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm hover:scale-[1.01]"
          >
            <Cpu className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? "Simulating..." : "Simulate 48h SLA Tick"}</span>
          </button>
          
          <button
            onClick={loadData}
            className="px-3.5 py-2.5 border hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2.5 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
            title="Exit Session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-gov-secondary rounded-xl">
              <Hourglass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Received</span>
              <span className="text-2xl font-extrabold text-gov-primary mt-0.5 block">{stats.total_complaints}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Pending Resolution</span>
              <span className="text-2xl font-extrabold text-gov-primary mt-0.5 block">{stats.pending_complaints}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-green-50 text-gov-success rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Closed & Resolved</span>
              <span className="text-2xl font-extrabold text-gov-primary mt-0.5 block">{stats.resolved_complaints}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center space-x-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Escalated (SLAs Exceeded)</span>
              <span className="text-2xl font-extrabold text-red-600 mt-0.5 block">{stats.escalated_complaints}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Charts & Table */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: SVG Charts and Analytical Splits */}
        {stats && (
          <div className="xl:col-span-1 space-y-6">
            
            {/* Chart showing breakdown based on Super Admin vs Department Desk */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gov-primary mb-4 uppercase tracking-wider flex items-center">
                <BarChart3 className="w-4 h-4 text-gov-secondary mr-1.5" />
                {loggedInDept === "All" ? "Department Distribution" : "Status Operations Split"}
              </h3>
              
              <div className="space-y-3.5">
                {loggedInDept === "All" ? (
                  /* Super Admin sees category distributions */
                  Object.entries(stats.category_data).map(([cat, count]) => {
                    const maxCount = Math.max(...Object.values(stats.category_data), 1);
                    const widthPercent = (count / maxCount) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>{cat}</span>
                          <span>{count}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gov-secondary h-full rounded-full transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Department Officer sees status distributions of their own ticket queue */
                  <>
                    {[
                      { label: "Submitted Ingested", status: "Submitted", color: "bg-blue-500" },
                      { label: "Assigned & Logged", status: "Assigned", color: "bg-purple-500" },
                      { label: "Field In Progress", status: "In Progress", color: "bg-yellow-500" },
                      { label: "Escalated SLA Exceeded", status: "Escalated", color: "bg-red-500" },
                      { label: "Resolved closed", status: "Resolved", color: "bg-green-500" }
                    ].map((st) => {
                      // Filter local count of specific status
                      const count = complaints.filter(c => c.status === st.status).length;
                      const maxCount = Math.max(complaints.length, 1);
                      const widthPercent = (count / maxCount) * 100;
                      return (
                        <div key={st.status} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>{st.label}</span>
                            <span>{count}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`${st.color} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gov-primary mb-3 uppercase tracking-wider">Priority Split</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-2 w-full">
                  {Object.entries(stats.priority_data).map(([prio, count]) => {
                    const total = stats.total_complaints || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={prio} className="flex items-center justify-between text-xs">
                        <span className="flex items-center">
                          <span className={`w-2.5 h-2.5 rounded-full mr-2 ${
                            prio === 'High' ? 'bg-red-500' : prio === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          <span className="font-semibold text-slate-600">{prio}</span>
                        </span>
                        <span className="text-slate-400 font-bold">{count} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Average Resolution Time</span>
                <span className="text-xl font-black text-gov-primary mt-1 block">{stats.avg_resolution_hours} Hours</span>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Table + Filters */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          
          {/* Advanced Search & Filtering bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket number, location, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-gov-secondary text-xs transition-all bg-slate-50/50"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap sm:flex-nowrap shrink-0">
              {/* Department selector shown ONLY for Super Admin */}
              {loggedInDept === "All" ? (
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="border rounded-xl px-2 py-2 text-xs font-bold text-gov-primary focus:outline-none bg-amber-50/20 border-amber-100"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS_LIST.filter(d => d.id !== "All").map(d => (
                    <option key={d.id} value={d.name}>{d.tag}</option>
                  ))}
                </select>
              ) : (
                <div className="border rounded-xl px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 border-slate-100 flex items-center gap-1.5 select-none">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Locked Desk Queue</span>
                </div>
              )}

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Electricity">Electricity</option>
                <option value="Roads">Roads</option>
                <option value="Health">Health</option>
                <option value="Public Safety">Public Safety</option>
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 font-mono">Ticket ID</th>
                  <th className="py-3.5 px-4">Subject</th>
                  {loggedInDept === "All" && <th className="py-3.5 px-4">Routed Department</th>}
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Priority</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {complaints.length > 0 ? (
                  complaints.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gov-primary">{item.id}</td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <span className="font-semibold text-slate-800 block truncate">{item.title}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{item.location}</span>
                      </td>
                      {loggedInDept === "All" && (
                        <td className="py-3 px-4 max-w-[150px] truncate text-slate-500 font-medium">
                          {item.department ? item.department.split(" (")[0] : "General"}
                        </td>
                      )}
                      <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectComplaint(item.id)}
                          className="inline-flex items-center text-gov-secondary hover:text-gov-primary font-bold text-xs hover:gap-1.5 transition-all"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={loggedInDept === "All" ? 7 : 6} className="py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span>No grievances match specified filter queries in this desk queue.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
