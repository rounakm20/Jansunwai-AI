import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Calendar, MapPin, Globe, Cpu, AlertTriangle, 
  CheckCircle2, Clock, ShieldAlert, CornerDownRight, CheckSquare, MessageSquareCode 
} from "lucide-react";
import { getComplaintDetails, updateComplaintStatus } from "../services/api";

export default function ComplaintDetails({ complaintId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [nextStatus, setNextStatus] = useState("In Progress");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getComplaintDetails(complaintId);
      setData(res);
      // Auto-set next sensible status
      if (res.complaint.status === "Assigned") {
        setNextStatus("In Progress");
      } else if (res.complaint.status === "In Progress" || res.complaint.status === "Escalated") {
        setNextStatus("Resolved");
      } else {
        setNextStatus("Resolved");
      }
    } catch (err) {
      setError("Failed to fetch complaint details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [complaintId]);

  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    if (!action.trim()) {
      alert("Please specify the details of the action taken.");
      return;
    }
    
    setSubmitting(true);
    try {
      await updateComplaintStatus(complaintId, nextStatus, action);
      setAction("");
      loadDetails();
    } catch (err) {
      alert("Error updating status. Ensure backend server is responsive.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      Submitted: <Clock className="w-5 h-5 text-blue-600" />,
      Assigned: <CornerDownRight className="w-5 h-5 text-purple-600" />,
      "In Progress": <Clock className="w-5 h-5 text-yellow-600 animate-spin" />,
      Escalated: <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />,
      Resolved: <CheckCircle2 className="w-5 h-5 text-green-600" />
    };
    return icons[status] || <Clock className="w-5 h-5 text-slate-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm animate-pulse">
        <Clock className="w-10 h-10 text-slate-300 mx-auto animate-spin mb-4" />
        <span className="text-slate-400 text-sm font-semibold">Loading Grievance Registry Details...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-red-100 shadow-sm text-red-500">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h4 className="font-bold text-lg">Error</h4>
        <p className="text-sm mt-1">{error || "Data load failed."}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl hover:bg-slate-200">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { complaint, history } = data;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back Header */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onBack}
          className="p-2 border hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-widest font-mono font-bold block">Grievance Inspector Detail View</span>
          <h2 className="text-xl font-bold text-gov-primary tracking-tight">Manage Complaint {complaint.id}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Complaint info & Status logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Grievance Subject</span>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{complaint.title}</h3>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Detailed Citizen Statement</span>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100/50 whitespace-pre-wrap font-sans">
                {complaint.description}
              </p>
            </div>

            {complaint.image_data && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Attached Supporting Photo</span>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-w-md shadow-sm group">
                  <img 
                    src={complaint.image_data} 
                    alt="Supporting Evidence" 
                    className="w-full h-auto object-cover max-h-80 transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
              <div className="flex items-center text-slate-500">
                <Calendar className="w-4.5 h-4.5 text-slate-400 mr-2 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Date Submitted</span>
                  <span className="font-semibold text-slate-700">{new Date(complaint.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center text-slate-500">
                <MapPin className="w-4.5 h-4.5 text-slate-400 mr-2 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Grievance Location</span>
                  <span className="font-semibold text-slate-700 truncate block max-w-[120px]">{complaint.location}</span>
                </div>
              </div>

              <div className="flex items-center text-slate-500">
                <Globe className="w-4.5 h-4.5 text-slate-400 mr-2 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Preferred Language</span>
                  <span className="font-semibold text-slate-700">{complaint.preferred_language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}</span>
                </div>
              </div>

              <div className="flex items-center text-slate-500">
                <Cpu className="w-4.5 h-4.5 text-slate-400 mr-2 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Detected Sentiment</span>
                  <span className="font-semibold text-slate-700">{complaint.sentiment || 'Neutral'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Log History */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gov-primary mb-6 pb-2 border-b">Official Progress History</h3>
            
            <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
              {history.map((log) => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-[30px] top-0 bg-white p-0.5 rounded-full shadow-sm">
                    {getStatusIcon(log.status)}
                  </span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{log.status} Checkpoint</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-600 space-y-2">
                      <div>
                        <strong className="text-[10px] text-slate-400 block uppercase">English SMS Alert</strong>
                        <p>{log.message_en}</p>
                      </div>
                      <div className="border-t pt-1.5 font-sans">
                        <strong className="text-[10px] text-slate-400 block uppercase">हिन्दी संदेश (Hindi SMS)</strong>
                        <p>{log.message_hi}</p>
                      </div>
                    </div>

                    {log.agent_reasoning && (
                      <div className="bg-blue-50/30 rounded-xl p-2.5 border border-blue-50/80 text-[10px] text-blue-900 font-mono">
                        <span className="font-bold text-gov-secondary uppercase block mb-0.5">Internal Agent Log Trace:</span>
                        {log.agent_reasoning}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: AI Classification metadata & Resolution tools */}
        <div className="space-y-6">
          
          {/* AI Metadata Details Panel */}
          <div className="bg-gradient-to-br from-slate-900 to-gov-primary text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6" />
            
            <div className="flex items-center space-x-2 text-gov-gold mb-4">
              <Cpu className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">AI Classification Meta</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-white/50 block font-medium">Assigned Department</span>
                <span className="font-bold text-white text-sm mt-0.5 block leading-tight">{complaint.department}</span>
              </div>

              <div>
                <span className="text-white/50 block font-medium">Classified Category</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{complaint.category}</span>
              </div>

              <div>
                <span className="text-white/50 block font-medium">SLA Priority Level</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                  complaint.priority === 'High' ? 'bg-red-500 text-white' : complaint.priority === 'Medium' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'
                }`}>
                  {complaint.priority}
                </span>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-white/50 block font-medium mb-1">Executive Summary</span>
                <p className="italic text-white/80 leading-relaxed">
                  "{complaint.summary || "Summary generation in queue..."}"
                </p>
              </div>
            </div>
          </div>

          {/* Action Resolution Form */}
          {complaint.status !== "Resolved" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gov-primary mb-4 flex items-center">
                <CheckSquare className="w-4 h-4 text-gov-secondary mr-1.5" />
                Submit Resolution Action
              </h3>

              <form onSubmit={handleSubmitStatus} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Transition Status</label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-secondary"
                  >
                    {complaint.status === "Assigned" && <option value="In Progress">Move to In Progress</option>}
                    <option value="Resolved">Mark as Resolved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Action Details (Public Note)</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. Sent repair truck to site. Sanitation cleanup verified by local division inspector..."
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-secondary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-gov-secondary hover:bg-gov-secondary/95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <span>Submit Resolution Details</span>}
                </button>
              </form>
            </div>
          )}

          {complaint.status === "Resolved" && (
            <div className="bg-green-50/50 rounded-3xl border border-green-100/80 p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-gov-success mx-auto mb-2" />
              <h4 className="font-bold text-sm text-green-800">Resolution Complete</h4>
              <p className="text-xs text-green-700 mt-0.5 leading-normal">
                This grievance has been audited and resolved. Auto-sms update has been dispatched to citizen.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
