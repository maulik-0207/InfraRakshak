"use client";

import { useState, useRef } from "react";
import { 
  Briefcase, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  Clock, 
  FileText,
  X,
  Camera,
  Film,
  AlertCircle
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";
import toast from "react-hot-toast";

interface Project {
  id: number;
  title: string;
  school_name: string;
  status: string;
  status_display: string;
  current_progress: number;
  bid_end_date: string;
}

interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

export default function ContractorProjects() {
  const { data: rawProjects, loading, refetch } = useApi<PaginatedResponse<Project>>(
    `${API.contracts.list}?status=AWARDED&status=IN_PROGRESS`
  );
  
  const projects = rawProjects?.results || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // File State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !selectedProject) {
        toast.error("Please select a file first");
        return;
    }

    setIsSubmitting(true);
    try {
        // Consolidated Submission: Only call ONE endpoint
        if (proofFile) {
            // If file exists, the proofs endpoint handles everything (file + progress)
            const formData = new FormData();
            formData.append("contract", selectedProject.id.toString());
            formData.append("file", proofFile);
            formData.append("file_type", "IMAGE");
            formData.append("progress_percentage", progress.toString());
            formData.append("description", note || `Work proof for ${progress}% progress`);

            const proofRes = await fetch(API.contracts.proofs, {
                method: "POST",
                body: formData
            });
            if (!proofRes.ok) throw new Error("Failed to upload file proof");
        } else {
            // Only progress update
            const progressRes = await fetch(API.contracts.progress, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contract: selectedProject.id,
                    progress_percentage: progress,
                    status: progress === 100 ? "COMPLETED" : "IN_PROGRESS",
                    update_note: note || `Progress updated to ${progress}%`
                })
            });
            if (!progressRes.ok) throw new Error("Failed to update status");
        }

        toast.success("Work proof submitted successfully!");
        setIsModalOpen(false);
        setProofFile(null);
        setNote("");
        refetch();
    } catch (err) {
        toast.error("Submission failed. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            Active <span className="text-[#F54E00]">Projects</span>
          </h1>
          <p className="text-[#4d4f46]">
            Manage your ongoing contracts and submit milestone proofs for verification.
          </p>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {[1,2].map(i => <div key={i} className="h-48 bg-[#eeefe9] animate-pulse rounded-2xl border border-[#b6b7af]" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-20 text-center bg-[#eeefe9] border border-[#b6b7af] border-dashed rounded-3xl">
           <AlertCircle className="w-12 h-12 text-[#9ea096] mx-auto mb-4" />
           <p className="font-black text-[#23251d]">No Active Projects Yet</p>
           <p className="text-[#4d4f46]">Apply for tenders in the marketplace to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm flex flex-col gap-6 group hover:shadow-xl hover:border-[#F54E00] transition-all">
              
              <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-xl bg-white border border-[#b6b7af] flex items-center justify-center text-[#F54E00] shadow-sm">
                       <Briefcase className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-[#23251d] leading-tight">{project.title}</h3>
                       <p className="text-sm font-bold text-[#4d4f46] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {project.school_name}
                       </p>
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-[#23251d] uppercase tracking-widest">Cumulative Progress</span>
                    <span className="text-2xl font-black text-[#F54E00]">{project.current_progress}%</span>
                 </div>
                 <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#b6b7af]/30">
                    <div className="h-full bg-[#F54E00] transition-all duration-1000" style={{ width: `${project.current_progress}%` }} />
                 </div>
              </div>

              <div className="pt-6 border-t border-[#b6b7af]/60 flex flex-wrap items-center justify-between gap-4 mt-auto">
                 <div className="flex gap-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest">End Date</span>
                       <span className="font-bold text-[#23251d] flex items-center gap-1 text-sm"><Clock className="w-3.5 h-3.5" /> {project.bid_end_date}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest">Status</span>
                       <span className={`font-bold flex items-center gap-1 text-sm ${project.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-green-600'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {project.status_display}
                       </span>
                    </div>
                 </div>

                 <button 
                  onClick={() => { 
                    setSelectedProject(project); 
                    setProgress(project.current_progress);
                    setIsModalOpen(true); 
                  }}
                  className="flex items-center gap-2 bg-[#F54E00] text-white px-6 h-12 rounded-xl font-black transition-all hover:bg-[#23251d] active:scale-95"
                 >
                    <Upload className="w-4 h-4" /> Submit Proof
                 </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Proof Submission Modal */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#23251d]/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="bg-[#fdfdf8] w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#eeefe9] p-8 border-b border-[#b6b7af] flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#F54E00] flex items-center justify-center text-white">
                     <Upload className="w-6 h-6" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-[#23251d]">Submit Work Proof</h2>
                     <p className="text-xs text-[#9ea096] font-bold uppercase tracking-widest truncate max-w-[200px]">{selectedProject.title}</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-5 h-5 text-[#4d4f46]" />
               </button>
            </div>

            <form onSubmit={handleSubmitProof} className="p-8 space-y-6">
               <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative h-44 w-full border-4 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
                        proofFile ? 'border-green-500 bg-green-50' : 'border-[#b6b7af] hover:border-[#F54E00] bg-[#eeefe9]'
                    }`}
                  >
                     {proofFile ? (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                            <span className="font-bold text-sm text-green-700">{proofFile.name}</span>
                        </div>
                     ) : (
                        <>
                           <Camera className="w-10 h-10 text-[#9ea096] mb-2" />
                           <p className="text-sm font-black text-[#23251d]">Click to upload photo evidence</p>
                           <p className="text-[10px] text-[#9ea096] font-bold uppercase tracking-widest mt-1">JPEG, PNG MAX 10MB</p>
                        </>
                     )}
                     <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">New Progress: {progress}%</label>
                  </div>
                  <input 
                     type="range" 
                     min={selectedProject.current_progress} 
                     max="100" 
                     step="5"
                     value={progress}
                     onChange={(e) => setProgress(parseInt(e.target.value))}
                     className="w-full accent-[#F54E00] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                  />
                  <div className="flex justify-between text-[10px] font-black text-[#9ea096] uppercase tracking-tighter">
                     <span>Currently at {selectedProject.current_progress}%</span>
                     <span>Target 100%</span>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Brief Description</label>
                  <textarea 
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-white border border-[#b6b7af] rounded-xl p-4 text-sm"
                    placeholder="Briefly describe what was updated..."
                  />
               </div>

               <button 
                  type="submit"
                  disabled={isSubmitting || !proofFile}
                  className="w-full h-14 bg-[#23251d] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#F54E00] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
               >
                  {isSubmitting ? "Uploading Proof..." : "Confirm & Send Verification"}
                  {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
