"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Download, 
  School, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  MoreVertical,
  Filter,
  Upload,
  AlertCircle
} from "lucide-react";

interface SchoolData {
  id: number;
  name: string;
  udise_code: string;
  district: string;
  school_type_display: string;
  is_active: boolean;
}

interface RegistrationRequest {
  id: number;
  school_name: string;
  status: string;
  status_display: string;
  submitted_at: string;
  submitted_by_name: string;
}

export default function DeoSchoolManagement() {
  const [activeTab, setActiveTab] = useState<"active" | "requests">("active");
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "active") {
        const res = await fetch("/api/v1/schools/schools/");
        if (res.ok) {
          const data = await res.json();
          setSchools(data.results || data);
        }
      } else {
        const res = await fetch("/api/v1/schools/registration-requests/");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.results || data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/v1/schools/schools/export/");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `schools_list_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    
    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("role", "SCHOOL");

    try {
      const res = await fetch("/api/v1/accounts/onboard/bulk/", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setIsBulkModalOpen(false);
        setBulkFile(null);
        alert("Bulk onboarding initiated successfully!");
        fetchData();
      }
    } catch (err) {
      console.error("Bulk upload failed", err);
    }
  };

  const UtilityButton = ({ icon: Icon, label, onClick, primary = false }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95
        ${primary 
          ? "bg-[#23251d] text-white hover:bg-[#F54E00]" 
          : "bg-white border border-[#b6b7af] text-[#4d4f46] hover:bg-[#eeefe9]"
        }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            School <span className="text-[#F54E00]">Registry</span>
          </h1>
          <p className="text-[#4d4f46]">
            Manage district schools, approve registrations, and maintain the central infrastructure database.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <UtilityButton icon={Download} label="Export list" onClick={handleExport} />
          <UtilityButton icon={FileSpreadsheet} label="Bulk Onboard" onClick={() => setIsBulkModalOpen(true)} />
          <UtilityButton icon={Plus} label="New School" primary />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#b6b7af]">
        <button 
          onClick={() => setActiveTab("active")}
          className={`px-8 py-4 font-black transition-all border-b-4 ${activeTab === "active" ? "border-[#F54E00] text-[#23251d]" : "border-transparent text-[#9ea096] hover:text-[#4d4f46]"}`}
        >
          Active Schools
        </button>
        <button 
          onClick={() => setActiveTab("requests")}
          className={`px-8 py-4 font-black transition-all border-b-4 flex items-center gap-2 ${activeTab === "requests" ? "border-[#F54E00] text-[#23251d]" : "border-transparent text-[#9ea096] hover:text-[#4d4f46]"}`}
        >
          Registration Requests 
          {requests.length > 0 && <span className="bg-[#F54E00] text-white text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>}
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl overflow-hidden shadow-sm">
        {activeTab === "active" ? (
          <div className="flex flex-col">
            <div className="p-6 border-b border-[#b6b7af] flex flex-col md:flex-row gap-4 items-center bg-white/30">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea096] w-4 h-4" />
                  <input type="text" placeholder="Search schools by name or UDISE code..." className="w-full h-11 pl-11 pr-4 bg-white rounded-xl border border-[#b6b7af] focus:border-[#F54E00] outline-none transition-colors" />
               </div>
               <button className="flex items-center gap-2 px-4 h-11 bg-white border border-[#b6b7af] rounded-xl font-bold text-[#4d4f46] hover:bg-[#eeefe9] transition-all">
                  <Filter className="w-4 h-4" /> Filter
               </button>
            </div>
            
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-white/50 text-[10px] font-black uppercase tracking-[0.15em] text-[#9ea096] border-b border-[#b6b7af]">
                     <th className="p-6">School Information</th>
                     <th className="p-6">Location</th>
                     <th className="p-6">Type</th>
                     <th className="p-6">Status</th>
                     <th className="p-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#b6b7af]/30">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-20 text-center font-bold text-[#9ea096]">Accessing register...</td></tr>
                  ) : schools.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center font-bold text-[#9ea096]">No schools registered in this district yet.</td></tr>
                  ) : (
                    schools.map(s => (
                      <tr key={s.id} className="hover:bg-white transition-colors group">
                         <td className="p-6">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-xl bg-[#23251d] flex items-center justify-center text-white shrink-0">
                                  <School className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="font-bold text-[#23251d]">{s.name}</p>
                                  <p className="text-xs font-bold text-[#9ea096]">UDISE: {s.udise_code}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-6">
                            <p className="text-sm font-bold text-[#4d4f46]">{s.district}</p>
                         </td>
                         <td className="p-6">
                            <span className="text-[10px] font-black uppercase text-[#23251d] bg-white border border-[#b6b7af] px-3 py-1 rounded-full">{s.school_type_display}</span>
                         </td>
                         <td className="p-6">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-full ${s.is_active ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                               <CheckCircle2 className="w-3 h-3" /> {s.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                         </td>
                         <td className="p-6 text-right">
                            <button className="p-2 hover:bg-[#eeefe9] rounded-lg text-[#9ea096] transition-colors"><MoreVertical className="w-5 h-5" /></button>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col">
            <table className="w-full text-left">
               <thead>
               <tr className="bg-white/50 text-[10px] font-black uppercase tracking-[0.15em] text-[#9ea096] border-b border-[#b6b7af]">
                     <th className="p-6">School Request</th>
                     <th className="p-6">Submitted By</th>
                     <th className="p-6">Date</th>
                     <th className="p-6 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#b6b7af]/30">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-20 text-center font-bold text-[#9ea096]">Fetching requests...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr>
                       <td colSpan={4} className="p-20 text-center">
                          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-4" />
                          <p className="font-bold text-[#23251d]">All requests processed!</p>
                          <p className="text-sm text-[#9ea096]">New registrations will appear here for review.</p>
                       </td>
                    </tr>
                  ) : (
                    requests.map(r => (
                      <tr key={r.id} className="hover:bg-white transition-colors group">
                        <td className="p-6">
                          <p className="font-bold text-[#23251d]">{r.school_name}</p>
                        </td>
                        <td className="p-6 text-sm text-[#4d4f46]">{r.submitted_by_name}</td>
                        <td className="p-6 text-sm text-[#4d4f46]">{new Date(r.submitted_at).toLocaleDateString()}</td>
                        <td className="p-6 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="h-9 px-4 bg-green-600 text-white text-[10px] font-black rounded-lg hover:bg-green-700 transition-all flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> APPROVE
                               </button>
                               <button className="h-9 px-4 bg-red-600 text-white text-[10px] font-black rounded-lg hover:bg-red-700 transition-all flex items-center gap-2">
                                  <XCircle className="w-3.5 h-3.5" /> REJECT
                               </button>
                            </div>
                            <span className="group-hover:hidden text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">{r.status_display}</span>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#23251d]/70 backdrop-blur-md" onClick={() => setIsBulkModalOpen(false)} />
          <div className="bg-[#fdfdf8] w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-[#b6b7af] bg-[#eeefe9] flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-xl bg-[#23251d] flex items-center justify-center text-white">
                      <FileSpreadsheet className="w-6 h-6" />
                   </div>
                   <h2 className="text-xl font-black text-[#23251d]">Bulk Onboarding</h2>
                </div>
                <button onClick={() => setIsBulkModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
             </div>
             
             <form onSubmit={handleBulkUpload} className="p-8 space-y-8">
                <div className="p-10 border-4 border-dashed border-[#b6b7af] rounded-2xl flex flex-col items-center justify-center bg-[#eeefe9] hover:border-[#F54E00] transition-colors cursor-pointer group relative">
                   {bulkFile ? (
                      <div className="text-center">
                         <FileSpreadsheet className="w-12 h-12 text-[#F54E00] mx-auto mb-3" />
                         <p className="font-bold text-[#23251d]">{bulkFile.name}</p>
                         <button type="button" onClick={() => setBulkFile(null)} className="text-[10px] font-black text-red-600 uppercase mt-2 hover:underline">Remove</button>
                      </div>
                   ) : (
                      <>
                        <Upload className="w-12 h-12 text-[#9ea096] group-hover:text-[#F54E00] transition-colors mb-4" />
                        <p className="font-black text-[#23251d] text-center">Click to upload Excel/CSV</p>
                        <p className="text-[10px] text-[#9ea096] uppercase font-bold tracking-widest mt-1">Download Template</p>
                      </>
                   )}
                   <input type="file" accept=".xlsx,.xls,.csv" required onChange={(e) => setBulkFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
                   <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                   <p className="text-xs text-amber-800 leading-relaxed">
                      Ensure your Excel file follows the standardized template. Incorrect formatting may lead to failed account generation and verification delays.
                   </p>
                </div>

                <button type="submit" disabled={!bulkFile} className="w-full h-14 bg-[#23251d] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#F54E00] transition-all disabled:opacity-50">
                   Initiate Processing
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
