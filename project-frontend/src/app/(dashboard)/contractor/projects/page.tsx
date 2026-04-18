"use client";

import { useEffect, useState } from "react";
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
  AlertCircle,
  MoreVertical
} from "lucide-react";

interface Project {
  id: number;
  title: string;
  school_name: string;
  status: string;
  progress: number;
  deadline: string;
}

export default function ContractorProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // File State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    // Mocking active projects for now
    setTimeout(() => {
      setProjects([
        { id: 101, title: "Building B Renovation", school_name: "Bright Future Academy", status: "ONGOING", progress: 65, deadline: "2024-05-20" },
        { id: 102, title: "Library Electrical Overhaul", school_name: "Saint Xavier High", status: "ONGOING", progress: 30, deadline: "2024-06-15" }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !selectedProject) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("contract", selectedProject.id.toString());
    formData.append("proof_file", proofFile);
    formData.append("progress_update", progress.toString());
    formData.append("description", "Work proof for phase completion");

    try {
      const res = await fetch("/api/v1/contracts/work-proofs/", {
        method: "POST",
        body: formData // No Content-Type header needed for FormData
      });

      if (res.ok) {
        setIsModalOpen(false);
        setProofFile(null);
        alert("Work proof submitted successfully!");
        fetchProjects();
      }
    } catch (err) {
      console.error("Proof submission failed", err);
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {[1,2].map(i => <div key={i} className="h-48 bg-[#eeefe9] animate-pulse rounded-2xl border border-[#b6b7af]" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-20 text-center bg-[#eeefe9] border border-[#b6b7af] border-dashed rounded-3xl">
           <AlertCircle className="w-12 h-12 text-[#9ea096] mx-auto mb-4" />
           <p className="font-black text-[#23251d]">No Active Projects</p>
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
                       <h3 className="text-2xl font-black text-[#23251d]">{project.title}</h3>
                       <p className="text-sm font-bold text-[#4d4f46] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {project.school_name}
                       </p>
                    </div>
                 </div>
                 <button className="p-2 hover:bg-white rounded-lg transition-colors text-[#9ea096]">
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-[#23251d] uppercase tracking-widest">Progress</span>
                    <span className="text-xl font-black text-[#F54E00]">{project.progress}%</span>
                 </div>
                 <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-[#b6b7af]/30">
                    <div className="h-full bg-[#F54E00] transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                 </div>
              </div>

              <div className="pt-6 border-t border-[#b6b7af] flex flex-wrap items-center justify-between gap-4 mt-auto">
                 <div className="flex gap-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-[#9ea096] uppercase">Deadline</span>
                       <span className="font-bold text-[#23251d] flex items-center gap-1 text-sm"><Clock className="w-3.5 h-3.5" /> {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-[#9ea096] uppercase">Status</span>
                       <span className="font-bold text-green-600 flex items-center gap-1 text-sm"><CheckCircle2 className="w-3.5 h-3.5" /> {project.status}</span>
                    </div>
                 </div>

                 <button 
                  onClick={() => { setSelectedProject(project); setIsModalOpen(true); }}
                  className="flex items-center gap-2 bg-[#F54E00] text-white px-6 h-12 rounded-xl font-black shadow-[0_4px_0_0_#b17816] hover:translate-y-[-2px] active:translate-y-[2px] transition-all group/btn"
                 >
                    <Upload className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" /> Submit Proof
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
                     <p className="text-xs text-[#9ea096] font-bold uppercase tracking-widest">{selectedProject.title}</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-5 h-5 text-[#4d4f46]" />
               </button>
            </div>

            <form onSubmit={handleSubmitProof} className="p-8 space-y-8">
               <div className="space-y-4 text-center">
                  <div className="relative h-48 w-full border-4 border-dashed border-[#b6b7af] rounded-2xl flex flex-col items-center justify-center bg-[#eeefe9] group hover:border-[#F54E00] transition-colors cursor-pointer overflow-hidden">
                     {proofFile ? (
                        <div className="absolute inset-0 p-2">
                           <div className="w-full h-full bg-[#23251d] rounded-xl flex items-center justify-center text-white flex-col gap-2">
                              <FileText className="w-10 h-10" />
                              <span className="font-bold text-xs truncate max-w-xs">{proofFile.name}</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setProofFile(null); }} className="mt-2 text-[10px] font-black text-[#F54E00] uppercase hover:underline">Remove File</button>
                           </div>
                        </div>
                     ) : (
                        <>
                           <div className="flex gap-4 mb-4">
                              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-[#9ea096] group-hover:text-[#F54E00] shadow-sm transition-colors">
                                 <Camera className="w-6 h-6" />
                              </div>
                              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-[#9ea096] group-hover:text-[#F54E00] shadow-sm transition-colors">
                                 <Film className="w-6 h-6" />
                              </div>
                           </div>
                           <p className="text-sm font-black text-[#23251d]">Click to upload photos/videos of work</p>
                           <p className="text-[10px] text-[#9ea096] font-bold uppercase tracking-widest mt-1">MAX SIZE: 50MB</p>
                        </>
                     )}
                     <input 
                        type="file" 
                        required
                        accept="image/*,video/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="text-sm font-black text-[#23251d] uppercase tracking-widest">New Progress: {progress}%</label>
                  </div>
                  <input 
                     type="range" 
                     min={selectedProject.progress} 
                     max="100" 
                     value={progress}
                     onChange={(e) => setProgress(parseInt(e.target.value))}
                     className="w-full accent-[#F54E00]" 
                  />
                  <div className="flex justify-between text-[10px] font-black text-[#9ea096] uppercase">
                     <span>Current: {selectedProject.progress}%</span>
                     <span>Target: 100%</span>
                  </div>
               </div>

               <button 
                  type="submit"
                  disabled={isSubmitting || !proofFile}
                  className="w-full h-14 bg-[#23251d] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#F54E00] disabled:opacity-50 disabled:pointer-events-none transition-all"
               >
                  {isSubmitting ? "Uploading Proof..." : "Confirm & Send for Verification"}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
