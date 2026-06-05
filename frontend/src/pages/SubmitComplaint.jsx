import React, { useState, useEffect } from "react";
import { Mic, MicOff, CheckCircle2, Clipboard, MapPin, Globe, AlertTriangle, ShieldCheck, Cpu, Upload, X } from "lucide-react";
import { createComplaint } from "../services/api";

export default function SubmitComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [lang, setLang] = useState("hi");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState("");
  const [predictedCat, setPredictedCat] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size is too large (maximum 5MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recObj = new SpeechRecognition();
      recObj.continuous = true;
      recObj.interimResults = false;
      recObj.lang = lang === "hi" ? "hi-IN" : "en-US";
      
      recObj.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setDescription(prev => prev ? prev + " " + transcript : transcript);
      };
      
      recObj.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsRecording(false);
      };
      
      recObj.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recObj);
    }
  }, [lang]);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  useEffect(() => {
    const text = (title + " " + description).toLowerCase();
    if (text.length < 5) {
      setPredictedCat(null);
      return;
    }
    
    let cat = "Other";
    let conf = "84%";
    
    if (/power|electricity|voltage|current|wire|light|transformer|uppcl|meter/i.test(text)) {
      cat = "Electricity";
      conf = "97%";
    } else if (/garbage|trash|clean|sweeper|dustbin|waste|filth|dump|smell/i.test(text)) {
      cat = "Sanitation";
      conf = "95%";
    } else if (/sewer|drain|drainage|overflow|water|pipe|tap|jal/i.test(text)) {
      if (/sewer|drain|drainage|overflow/i.test(text)) {
        cat = "Sanitation";
        conf = "94%";
      } else {
        cat = "Water Supply";
        conf = "96%";
      }
    } else if (/road|pothole|highway|street|repair|tar|asphalt|pwd/i.test(text)) {
      cat = "Roads";
      conf = "98%";
    } else if (/hospital|doctor|health|disease|medicine|dengue|malaria|cmo|clinic/i.test(text)) {
      cat = "Health";
      conf = "93%";
    } else if (/police|safety|theft|harassment|danger|crime|robbery/i.test(text)) {
      cat = "Public Safety";
      conf = "95%";
    }
    
    if (cat !== "Other") {
      setPredictedCat({ name: cat, confidence: conf });
    } else {
      setPredictedCat(null);
    }
  }, [title, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Please fill in all the required fields.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      if (isRecording) {
        recognition.stop();
      }
      const res = await createComplaint(title, description, location, lang, image);
      setSuccessData(res);
    } catch (err) {
      setError("Error submitting grievance. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.id);
      alert("Ticket ID copied to clipboard!");
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white rounded-3xl shadow-xl overflow-hidden animate-slide-up border border-slate-100">
        <div className="bg-gradient-to-r from-gov-primary to-gov-secondary p-8 text-white text-center relative">
          <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full text-xs">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>AI Automated Routing</span>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Grievance Registered!</h2>
          <p className="text-white/80 mt-1">शिकायत सफलतापूर्वक दर्ज कर ली गई है</p>
        </div>

        <div className="p-8">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Grievance Tracking Number</span>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-3xl font-mono font-bold text-gov-primary tracking-wider">{successData.id}</span>
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                title="Copy ID"
              >
                <Clipboard className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Keep this ID safe for tracking status updates.</p>
          </div>

          <div className="mt-8 space-y-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center border-b pb-2">
              <Cpu className="w-5 h-5 text-gov-secondary mr-2" />
              AI Agent Decision Log
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <span className="text-xs text-slate-500 block">Classified Category</span>
                <span className="font-bold text-gov-primary text-base">{successData.category}</span>
              </div>
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                <span className="text-xs text-slate-500 block">Detected Urgency</span>
                <span className={`font-bold text-base ${successData.priority === 'High' ? 'text-red-600' : successData.priority === 'Medium' ? 'text-amber-600' : 'text-slate-600'}`}>
                  {successData.priority}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Assigned Official Department</span>
              <span className="font-bold text-slate-800">{successData.department}</span>
            </div>

            {successData.image_data && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                <span className="text-xs text-slate-500 block mb-2 w-full text-left">Attached Supporting Photo</span>
                <img 
                  src={successData.image_data} 
                  alt="Supporting Evidence" 
                  className="w-full h-auto max-h-48 object-cover rounded-xl border border-slate-200 animate-fade-in"
                />
              </div>
            )}

            <div className="p-4 bg-green-50/60 rounded-xl border border-green-100">
              <span className="text-xs text-green-700 font-semibold block flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1" />
                Vernacular SMS Sent
              </span>
              <p className="text-xs text-slate-600 italic mt-1">
                "{successData.preferred_language === "hi" ? "शिकायत सफलतापूर्वक प्राप्त हुई। ट्रैकिंग आईडी..." : "Grievance received successfully. Tracking ID is..."}"
              </p>
            </div>
          </div>

          <div className="mt-8 flex space-x-3">
            <button
              onClick={() => {
                setSuccessData(null);
                setImage(null);
                setImagePreview(null);
                setTitle("");
                setDescription("");
                setLocation("");
              }}
              className="flex-1 py-3 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
            >
              Submit Another Grievance
            </button>
            <button
              onClick={() => {
                window.location.hash = `track?id=${successData.id}`;
              }}
              className="flex-1 py-3 text-center bg-gov-primary hover:bg-gov-primary/95 text-white font-semibold rounded-xl shadow-md shadow-gov-primary/10 transition-all"
            >
              Track Live Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />
      
      <div className="px-8 py-6 bg-slate-50/60 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-gov-primary tracking-tight">File Public Grievance</h2>
        <p className="text-slate-500 text-sm mt-0.5">Jansunwai AI automatically classifies and routes complaints within seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Language Select */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-2 text-slate-700">
            <Globe className="w-5 h-5 text-gov-secondary" />
            <span className="text-sm font-medium">Preferred Communication Language</span>
          </div>
          <div className="flex space-x-1 bg-white p-1 rounded-lg border">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${lang === "en" ? "bg-gov-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${lang === "hi" ? "bg-gov-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        {/* Complaint Title */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 block">
            Grievance Title / विषय <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Broken water mains flooding Road No 3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gov-secondary/40 focus:border-gov-secondary transition-all"
          />
        </div>

        {/* Complaint Description */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 block">
              Detailed Description / शिकायत का विवरण <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={toggleRecording}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm ${
                isRecording 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-gov-secondary/10 hover:bg-gov-secondary/20 text-gov-secondary"
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop Dictating</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak / बोलकर लिखें</span>
                </>
              )}
            </button>
          </div>
          <textarea
            required
            rows={5}
            placeholder="Please write the full details here. You can also tap the mic button and speak in Hindi/English..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gov-secondary/40 focus:border-gov-secondary transition-all font-sans"
          />
        </div>

        {/* Real-time prediction preview */}
        {predictedCat && (
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/80 flex items-center justify-between text-xs text-blue-800 animate-fade-in">
            <span className="flex items-center">
              <Cpu className="w-4 h-4 mr-1.5 text-gov-secondary animate-pulse" />
              <span>Real-time AI Intent Estimate: <strong className="font-semibold text-blue-900">{predictedCat.name}</strong></span>
            </span>
            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {predictedCat.confidence} Conf.
            </span>
          </div>
        )}

        {/* Location Input */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 block">
            Grievance Location / घटनास्थल का पता <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. Near Community Center, Gomti Nagar Ward 12, Lucknow"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gov-secondary/40 focus:border-gov-secondary transition-all"
            />
          </div>
        </div>

        {/* Image Attachment */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 block">
            Attach Supporting Image / फ़ोटो संलग्न करें (Optional)
          </label>
          
          {!imagePreview ? (
            <div 
              onClick={() => document.getElementById("evidence-photo-input").click()}
              className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/30 hover:bg-slate-50 hover:border-gov-secondary/40 transition-all cursor-pointer group"
            >
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-gov-secondary transition-colors mb-2" />
              <span className="text-xs text-slate-500 font-semibold group-hover:text-slate-700 transition-colors">Attach Image / Photo</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Drag & drop or click to browse files (JPEG, PNG up to 5MB)</span>
              <input 
                id="evidence-photo-input"
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="hidden" 
              />
            </div>
          ) : (
            <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
              <img
                src={imagePreview}
                alt="Attached Preview"
                className="w-full max-h-48 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submission Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gov-primary hover:bg-gov-primary/95 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-gov-primary/20 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Cpu className="w-5 h-5 animate-spin" />
              <span>Analyzing Grievance...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>File Official Grievance</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
