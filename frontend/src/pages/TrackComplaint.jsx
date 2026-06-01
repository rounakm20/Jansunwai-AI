import React, { useState, useEffect } from "react";
import { Search, Loader2, Calendar, MapPin, Building2, UserCheck, AlertOctagon, HelpCircle, AlertCircle, FileText } from "lucide-react";
import { getComplaintDetails } from "../services/api";

export default function TrackComplaint() {
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaintData, setComplaintData] = useState(null);
  const [error, setError] = useState("");

  // Extract initial ticket ID from hash parameters if present
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes("track")) {
        const urlParams = new URLSearchParams(hash.split("?")[1]);
        const id = urlParams.get("id");
        if (id) {
          setTicketId(id);
          fetchDetails(id);
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const fetchDetails = async (idToFetch) => {
    const targetId = idToFetch || ticketId;
    if (!targetId.trim()) return;

    setLoading(true);
    setError("");
    setComplaintData(null);

    try {
      const data = await getComplaintDetails(targetId.trim());
      setComplaintData(data);
    } catch (err) {
      setError("Ticket ID not found. Verify it matches the format TKT-XXXXXX.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDetails();
  };

  const getStatusBadge = (status) => {
    const classes = {
      Submitted: "bg-blue-100 text-blue-800 border-blue-200",
      Assigned: "bg-purple-100 text-purple-800 border-purple-200",
      "In Progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Escalated: "bg-red-100 text-red-800 border-red-200 animate-pulse",
      Resolved: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${classes[status] || "bg-slate-100"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-6">
      {/* Search Box */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 animate-slide-up">
        <h2 className="text-xl font-bold text-gov-primary mb-1">Track Grievance Status</h2>
        <p className="text-xs text-slate-500 mb-4">Enter your TKT-XXXXXX reference code to see live progress.</p>
        
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. TKT-582910"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gov-secondary/40 focus:border-gov-secondary font-mono tracking-wider transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-gov-primary hover:bg-gov-primary/95 text-white font-bold rounded-xl shadow-md shadow-gov-primary/10 transition-all flex items-center justify-center space-x-2 shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Track Progress</span>}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {complaintData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          {/* Main complaint summary details */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Ticket Information</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block">Status</span>
                  <div className="mt-1">{getStatusBadge(complaintData.complaint.status)}</div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Category</span>
                  <span className="text-sm font-bold text-slate-800">{complaintData.complaint.category}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Department</span>
                  <span className="text-sm font-semibold text-slate-800 block leading-tight">{complaintData.complaint.department}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Grievance Priority</span>
                  <span className={`text-xs font-bold uppercase ${complaintData.complaint.priority === 'High' ? 'text-red-600' : 'text-slate-600'}`}>
                    {complaintData.complaint.priority}
                  </span>
                </div>

                <div className="pt-2 border-t text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    <span>Filed: {new Date(complaintData.complaint.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    <span>{complaintData.complaint.location}</span>
                  </div>
                </div>

                {complaintData.complaint.image_data && (
                  <div className="pt-3 border-t">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Attached supporting photo</span>
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-full shadow-sm">
                      <img 
                        src={complaintData.complaint.image_data} 
                        alt="Attached Evidence" 
                        className="w-full h-auto object-cover max-h-48"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-gov-primary rounded-2xl shadow-md p-6 text-white">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-gov-gold" />
                AI Generated Summary
              </h3>
              <p className="text-xs leading-relaxed font-medium italic text-white/90">
                "{complaintData.complaint.summary || "Complaint is undergoing quick summarization."}"
              </p>
            </div>
          </div>

          {/* Timeline History */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-gov-primary mb-6 pb-2 border-b">Live Status Timeline</h3>
            
            <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-8">
              {complaintData.history.map((log, index) => {
                const isLatest = index === complaintData.history.length - 1;
                return (
                  <div key={log.id} className="relative">
                    {/* Timeline Node Point */}
                    <span className={`absolute -left-[31px] top-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full border-4 border-white ${
                      isLatest ? "bg-gov-secondary shadow-md ring-4 ring-gov-secondary/20" : "bg-slate-300"
                    }`} />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${isLatest ? 'text-gov-secondary' : 'text-slate-500'}`}>
                          {log.status} Action
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Bilingual Alerts */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-2">
                        <div className="border-l-2 border-gov-secondary pl-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">English SMS</span>
                          <p className="text-slate-700 leading-normal">{log.message_en}</p>
                        </div>
                        
                        <div className="border-l-2 border-gov-gold pl-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">हिन्दी संदेश (Hindi)</span>
                          <p className="text-slate-700 leading-normal font-sans">{log.message_hi}</p>
                        </div>
                      </div>

                      {/* AI Reasoning Log (Visible AI) */}
                      {log.agent_reasoning && (
                        <div className="bg-blue-50/40 rounded-xl p-3 border border-blue-50/80 text-[11px] text-blue-900/90 leading-relaxed font-mono flex items-start">
                          <AlertOctagon className="w-3.5 h-3.5 text-gov-secondary mr-2 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-gov-primary block text-[10px] uppercase tracking-wider mb-0.5">AI Agent Trace Log:</span>
                            {log.agent_reasoning}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Static Welcome Card when no data is loaded */}
      {!complaintData && !loading && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center animate-slide-up">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gov-primary mb-1">State Grievance Command System</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Input a valid Ticket reference code generated upon submission to track investigation checkpoints, official notes, and escalation logs.
          </p>
        </div>
      )}
    </div>
  );
}
