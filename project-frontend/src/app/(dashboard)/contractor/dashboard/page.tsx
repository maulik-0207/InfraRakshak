"use client";

import { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileSearch,
  IndianRupee,
  Plus,
  ArrowRight,
  Upload,
  AlertCircle,
  Building,
  MapPin,
  Calendar,
  X
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Contract {
  id: number;
  title: string;
  description: string;
  category: "PLUMBING" | "ELECTRICAL" | "STRUCTURAL";
  estimated_cost: string;
  priority_level: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  school_name: string;
  district: string;
  current_progress: number;
  bid_start_date: string;
  bid_end_date: string;
}

interface Bid {
  id: number;
  contract: number;
  contract_title: string;
  bid_amount: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  submitted_at: string;
  proposal_text: string;
}

interface DashboardStats {
  active_projects: number;
  pending_bids: number;
  total_earnings: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Marketplace Panel ──────────────────────────────────────────────────────

function MarketplacePanel() {
  const { data: rawContracts, loading, refetch } = useApi<PaginatedResponse<Contract>>(
    `${API.contracts.list}?status=OPEN&status=IN_BIDDING`
  );
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [days, setDays] = useState("30");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitBid = async () => {
    if (!selectedContract) return;
    if (!bidAmount || !proposal) {
        toast.error("Please fill in all fields");
        return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(API.contracts.bids, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract: selectedContract.id,
          bid_amount: bidAmount,
          proposal_text: proposal,
          estimated_days: parseInt(days)
        }),
      });

      if (!response.ok) throw new Error("Failed to submit bid");
      
      toast.success("Bid submitted successfully!");
      setSelectedContract(null);
      setBidAmount("");
      setProposal("");
      refetch();
    } catch (error) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4 pt-10">
    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-[#eeefe9] rounded-2xl" />)}
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black text-[#23251d] uppercase tracking-tight">Available Contracts</h2>
        <span className="text-sm font-bold text-[#4d4f46] bg-[#eeefe9] px-3 py-1 rounded-full">
          {rawContracts?.count ?? 0} Openings
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rawContracts?.results?.map((c) => (
          <div key={c.id} className="bg-white border border-[#b6b7af] rounded-2xl p-6 shadow-sm hover:border-[#F54E00] transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    c.category === 'PLUMBING' ? 'bg-blue-100 text-blue-700' :
                    c.category === 'ELECTRICAL' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {c.category}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    c.priority_level === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {c.priority_level} Priority
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#23251d] group-hover:text-[#F54E00] transition-colors">
                  {c.title}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#9ea096] uppercase tracking-widest">Est. Budget</div>
                <div className="text-xl font-black text-[#23251d]">₹{(parseFloat(c.estimated_cost) || 0).toLocaleString()}</div>
              </div>
            </div>

            <p className="text-[#4d4f46] text-sm mb-6 line-clamp-2">{c.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 bg-[#f8f9f4] p-3 rounded-xl border border-[#b6b7af]/30">
                    <Building className="w-4 h-4 text-[#F54E00]" />
                    <div>
                        <div className="text-[10px] font-black text-[#9ea096] uppercase">School</div>
                        <div className="text-xs font-bold truncate">{c.school_name}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-[#f8f9f4] p-3 rounded-xl border border-[#b6b7af]/30">
                    <MapPin className="w-4 h-4 text-[#F54E00]" />
                    <div>
                        <div className="text-[10px] font-black text-[#9ea096] uppercase">District</div>
                        <div className="text-xs font-bold truncate">{c.district}</div>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => setSelectedContract(c)}
                className="w-full py-3 bg-[#23251d] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#F54E00] transition-all flex items-center justify-center gap-2"
            >
                Submit Proposal <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Bid Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-[#23251d]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#eeefe9] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-[#b6b7af]/40 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl font-black text-[#23251d]">Submit Proposal</h3>
                        <p className="text-xs font-bold text-[#F54E00] uppercase tracking-widest">{selectedContract.title}</p>
                    </div>
                    <button onClick={() => setSelectedContract(null)} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Your Bid Amount (₹)</label>
                            <input 
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-black"
                                placeholder="e.g. 125000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Timeline (Days)</label>
                            <input 
                                type="number"
                                value={days}
                                onChange={(e) => setDays(e.target.value)}
                                className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-black"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Detailed Proposal</label>
                        <textarea 
                            rows={4}
                            value={proposal}
                            onChange={(e) => setProposal(e.target.value)}
                            className="w-full bg-white border border-[#b6b7af] rounded-xl p-4 text-sm"
                            placeholder="Describe your plan, materials to be used, and quality assurance..."
                        />
                    </div>
                    
                    <button 
                        onClick={handleSubmitBid}
                        disabled={submitting}
                        className="w-full py-4 bg-[#F54E00] text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {submitting ? "Submitting..." : "Send Proposal Now"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// ─── My Bids Panel ──────────────────────────────────────────────────────────

function BidsPanel() {
  const { data: rawBids, loading } = useApi<PaginatedResponse<Bid>>(API.contracts.bids);

  if (loading) return <div className="space-y-4 pt-10 text-center text-[#4d4f46] font-bold">Loading your proposals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black text-[#23251d] uppercase tracking-tight">Sent Proposals</h2>
      </div>

      <div className="bg-white border border-[#b6b7af] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
            <thead className="bg-[#f8f9f4] border-b border-[#b6b7af]/40">
                <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-[#9ea096] uppercase tracking-widest">Contract</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-[#9ea096] uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-[#9ea096] uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-[#9ea096] uppercase tracking-widest">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#b6b7af]/20">
                {rawBids?.results?.map(bid => (
                    <tr key={bid.id} className="hover:bg-[#f8f9f4] transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-[#23251d]">{bid.contract_title || `Contract #${bid.contract}`}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-sm">₹{parseFloat(bid.bid_amount).toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs font-bold text-[#4d4f46]">
                            {format(new Date(bid.submitted_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                bid.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                bid.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {bid.status}
                            </span>
                        </td>
                    </tr>
                ))}
                {(rawBids?.results?.length ?? 0) === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[#9ea096] font-bold">No proposals found. Start bidding in the Marketplace!</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Active Work Panel ──────────────────────────────────────────────────────

function ActiveWorkPanel() {
  const { data: rawProjects, loading, refetch } = useApi<PaginatedResponse<Contract>>(
    `${API.contracts.list}?status=AWARDED&status=IN_PROGRESS`
  );
  const [reporting, setReporting] = useState<Contract | null>(null);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // For file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleUpdateProgress = async () => {
    if (!reporting) return;
    setSubmitting(true);
    try {
        // Consolidated Submission: Only call ONE endpoint
        if (proofFile) {
            // If file exists, the proofs endpoint handles everything (file + progress)
            const formData = new FormData();
            formData.append("contract", reporting.id.toString());
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
                    contract: reporting.id,
                    progress_percentage: progress,
                    status: progress === 100 ? "COMPLETED" : "IN_PROGRESS",
                    update_note: note || `Progress updated to ${progress}%`
                })
            });
            if (!progressRes.ok) throw new Error("Failed to update status");
        }

        toast.success("Work progress updated!");
        setReporting(null);
        setNote("");
        setProgress(0);
        setProofFile(null);
        refetch();
    } catch (error) {
        toast.error("Failed to update status");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4 pt-10">
    <div className="h-40 bg-[#eeefe9] rounded-2xl" />
  </div>;

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-black text-[#23251d] uppercase tracking-tight">In-Progress Projects</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rawProjects?.results?.map(proj => (
                <div key={proj.id} className="bg-white border border-[#b6b7af] rounded-2xl p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4">
                         <div className="text-[10px] font-black bg-[#F54E00] text-white px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                            Active Work
                        </div>
                    </div>

                    <h3 className="text-lg font-black text-[#23251d] mb-1">{proj.title}</h3>
                    <p className="text-xs font-bold text-[#F54E00] uppercase tracking-widest mb-4">{proj.school_name}</p>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-xs font-bold text-[#4d4f46]">
                            <span>Work Progress</span>
                            <span>{proj.current_progress}%</span>
                        </div>
                        <div className="h-2 bg-[#eeefe9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#F54E00] rounded-full transition-all duration-1000" style={{ width: `${proj.current_progress}%` }} />
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            setReporting(proj);
                            setProgress(proj.current_progress);
                        }}
                        className="w-full py-3 bg-[#eeefe9] border border-[#b6b7af] text-[#23251d] rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#23251d] hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        Post Update <Upload className="w-4 h-4" />
                    </button>
                </div>
            ))}

            {(rawProjects?.results?.length ?? 0) === 0 && (
                <div className="lg:col-span-2 py-20 text-center bg-[#f8f9f4] border border-dashed border-[#b6b7af] rounded-3xl">
                    <Briefcase className="w-12 h-12 text-[#9ea096] mx-auto mb-4" />
                    <p className="text-[#9ea096] font-bold">No active projects yet. Check the Marketplace!</p>
                </div>
            )}
        </div>

        {/* Update Modal */}
        {reporting && (
             <div className="fixed inset-0 bg-[#23251d]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-[#eeefe9] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-[#b6b7af]/40 flex justify-between items-center bg-white">
                     <h3 className="text-xl font-black text-[#23251d]">Post Work Update</h3>
                     <button onClick={() => setReporting(null)} className="p-2 hover:bg-gray-100 rounded-full">
                         <X className="w-5 h-5" />
                     </button>
                 </div>
                 <div className="p-8 space-y-6">
                     <div className="space-y-3">
                         <div className="flex justify-between">
                            <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Progress: {progress}%</label>
                            {progress === 100 && <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Mark as finished</span>}
                         </div>
                         <input 
                             type="range"
                             min="0"
                             max="100"
                             step="5"
                             value={progress}
                             onChange={(e) => setProgress(parseInt(e.target.value))}
                             className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-[#F54E00]"
                         />
                     </div>

                     <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Update Note</label>
                         <textarea 
                             rows={3}
                             value={note}
                             onChange={(e) => setNote(e.target.value)}
                             className="w-full bg-white border border-[#b6b7af] rounded-xl p-4 text-sm"
                             placeholder="What was achieved today?"
                         />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Upload Proof Image (Optional)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                proofFile ? 'border-green-500 bg-green-50' : 'border-[#b6b7af] hover:border-[#F54E00] bg-white'
                            }`}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            />
                            {proofFile ? (
                                <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                                    <CheckCircle2 className="w-5 h-5" /> {proofFile.name}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Upload className="w-8 h-8 text-[#9ea096] mx-auto mb-2" />
                                    <p className="text-xs font-bold text-[#4d4f46]">Click to upload photo evidence</p>
                                    <p className="text-[10px] text-[#9ea096]">JPEG, PNG up to 10MB</p>
                                </div>
                            )}
                        </div>
                     </div>
                     
                     <button 
                         onClick={handleUpdateProgress}
                         disabled={submitting}
                         className="w-full py-4 bg-[#23251d] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#F54E00] transition-all disabled:opacity-50"
                     >
                         {submitting ? "Publishing..." : "Confirm & Send Verification"}
                     </button>
                 </div>
             </div>
         </div>
        )}
    </div>
  );
}

// ─── Dashboard Stats Card ───────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-[#eeefe9] border border-[#b6b7af] p-8 rounded-3xl relative overflow-hidden group hover:border-[#F54E00] transition-all">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16 text-[#23251d]" />
      </div>
      <div className="text-xs font-black text-[#4d4f46] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-3xl font-black text-[#23251d] tracking-tighter mb-2">{value}</div>
      {trend && (
        <div className="flex items-center gap-1.5 text-xs font-black text-[#F54E00] uppercase tracking-widest">
          <TrendingUp className="w-3 h-3" /> {trend}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

type Tab = "active" | "bids" | "marketplace";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "active", label: "Active Work", icon: Briefcase },
  { id: "bids", label: "My Bids", icon: Clock },
  { id: "marketplace", label: "Marketplace", icon: FileSearch },
];

export default function ContractorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const { data: dashboardData, loading: statsLoading } = useApi<any>(API.dashboard);

  const stats = dashboardData?.stats || { active_projects: 0, pending_bids: 0, total_earnings: 0 };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
          Contractor <span className="text-[#F54E00]">Portal</span>
        </h1>
        <p className="text-[#4d4f46] font-medium">Manage your bids, track active infrastructure projects, and submit proof of work.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Active Projects" 
          value={stats.active_projects} 
          icon={Briefcase}
        />
        <StatCard 
          label="Pending Bids" 
          value={stats.pending_bids} 
          icon={Clock}
        />
        <StatCard 
          label="Total Earnings" 
          value={`₹${(stats.total_earnings || 0).toLocaleString()}`} 
          icon={IndianRupee}
        />
      </div>

      {/* Main Interaction Area */}
      <div className="space-y-8">
        <div className="flex gap-1.5 bg-[#eeefe9] border border-[#b6b7af] p-1.5 rounded-2xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-[#23251d] text-white shadow-lg"
                  : "text-[#4d4f46] hover:bg-[#b6b7af]/20"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-transparent">
          {activeTab === "active" && <ActiveWorkPanel />}
          {activeTab === "bids" && <BidsPanel />}
          {activeTab === "marketplace" && <MarketplacePanel />}
        </div>
      </div>
    </div>
  );
}
