"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  Check, 
  X, 
  School, 
  MapPin, 
  Calendar, 
  Info, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface RegistrationRequest {
  id: number;
  school_name: string;
  status: string;
  status_display: string;
  submitted_at: string;
  submitted_by_name: string;
  district: string;
  address: string;
}

export default function NotificationsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/schools/registration-requests/?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch registration requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/v1/schools/registration-requests/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
      } else {
        const errData = await res.json();
        alert(`Error: ${JSON.stringify(errData)}`);
      }
    } catch (err) {
      console.error(`Failed to ${status} request`, err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-4 md:p-8 text-slate-900 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#23251d]">
              School <span className="text-[#F54E00]">Requests</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">Verify and authorize new school registrations in your district.</p>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-[#eeefe9] border border-[#b6b7af] flex items-center justify-center shadow-sm relative shrink-0">
             <Bell size={28} className="text-[#4d4f46]" />
             {requests.length > 0 && (
               <div className="absolute -top-1 -right-1 h-6 w-6 bg-[#F54E00] text-white text-[10px] font-black rounded-full border-4 border-[#fdfdf8] flex items-center justify-center">
                 {requests.length}
               </div>
             )}
          </div>
        </header>

        <div className="space-y-6">
          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#F54E00] animate-spin" />
              <p className="font-bold text-[#9ea096]">Accessing registration queue...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-[#eeefe9]/50 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-[#b6b7af]">
               <div className="h-24 w-24 bg-white text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <CheckCircle2 size={48} />
               </div>
               <h3 className="text-2xl font-black text-[#23251d] tracking-tight">Everything is Up to Date</h3>
               <p className="text-[#4d4f46] font-semibold mt-2 max-w-sm mx-auto">All pending school registrations have been processed. New requests will appear here once submitted.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-[#eeefe9] rounded-[2rem] border border-[#b6b7af] shadow-sm overflow-hidden group hover:border-[#F54E00] transition-all duration-300">
                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 bg-[#23251d] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                        <School size={32} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-black tracking-tight text-[#23251d]">{req.school_name}</h3>
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black border border-amber-200 rounded-lg tracking-widest uppercase">
                            {req.status_display}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-[#4d4f46] font-bold text-xs uppercase tracking-wider">
                           <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-[#F54E00]" />
                              {req.district}
                           </div>
                           <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-[#F54E00]" />
                              {new Date(req.submitted_at).toLocaleDateString()}
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                        disabled={processingId === req.id}
                        onClick={() => handleAction(req.id, "REJECTED")}
                        className="flex-1 md:flex-none h-14 w-14 border-2 border-[#b6b7af] rounded-2xl flex items-center justify-center text-[#4d4f46] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                      >
                         <X size={24} />
                      </button>
                      <button 
                        disabled={processingId === req.id}
                        onClick={() => handleAction(req.id, "APPROVED")}
                        className="flex-1 md:flex-none h-14 px-8 bg-[#23251d] text-white font-black rounded-2xl hover:bg-[#F54E00] transition-all shadow-xl shadow-[#23251d]/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         {processingId === req.id ? "PROCESSING..." : (
                           <>AUTHORIZE SCHOOL <ArrowRight size={18} /></>
                         )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/40 rounded-2xl p-6 border border-[#b6b7af]/30">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.15em]">Official Address</span>
                        <p className="text-sm font-bold text-[#23251d] leading-relaxed">{req.address}</p>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.15em]">Admin Contact</span>
                        <p className="text-sm font-bold text-[#23251d]">{req.submitted_by_name} <span className="text-[#9ea096] text-xs font-semibold ml-1">(Applicant)</span></p>
                     </div>
                  </div>
                </div>
                
                <div className="bg-[#23251d] px-8 py-3 flex items-center justify-between">
                   <span className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                     <Info size={12} />
                     Unique ID: REQ-{req.id.toString().padStart(4, '0')}
                   </span>
                   <button className="text-[10px] font-black text-[#F54E00] hover:text-white transition-colors uppercase tracking-[0.2em]">
                      View Full Dossier
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
