"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, FileText, CheckCircle2, Clock, 
  MoreVertical, IndianRupee, Loader2, X, AlertTriangle,
  Building, LayoutGrid, Calendar, Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";

interface Contract {
  id: number;
  school: number;
  school_name: string;
  prediction_report: number;
  title: string;
  description: string;
  category: string;
  category_display: string;
  estimated_cost: string;
  priority_level: string;
  priority_display: string;
  status: string;
  status_display: string;
  bid_start_date: string;
  bid_end_date: string;
  created_by: number;
  created_at: string;
}

interface School {
  id: number;
  name: string;
  udise_code: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [schools, setSchools] = useState<School[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    school: "",
    title: "",
    description: "",
    category: "PLUMBING",
    estimated_cost: "",
    priority_level: "MEDIUM",
    bid_start_date: "",
    bid_end_date: ""
  });

  useEffect(() => {
    fetchContracts();
    fetchSchools();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/contracts/contracts/");
      if (res.ok) {
        const data = await res.json();
        setContracts(data.results || data);
      }
    } catch (err) {
      toast.error("Failed to load contracts");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/v1/schools/schools/");
      if (res.ok) {
        const data = await res.json();
        setSchools(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch schools", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Sanitize: convert empty strings to null for optional fields
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === "" ? null : v])
      );

      const res = await fetch("/api/v1/contracts/contracts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Contract created successfully!");
        setIsModalOpen(false);
        setFormData({
          school: "",
          title: "",
          description: "",
          category: "PLUMBING",
          estimated_cost: "",
          priority_level: "MEDIUM",
          bid_start_date: "",
          bid_end_date: ""
        });
        fetchContracts();
      } else {
        const errorData = await res.json();
        const firstError = Object.values(errorData)[0];
        const msg = Array.isArray(firstError) ? firstError[0] : (errorData.detail || "Failed to create contract");
        toast.error(`${msg}`);
      }
    } catch (err) {
      toast.error("An error occurred during creation");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contract? This action cannot be undone.")) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/v1/contracts/contracts/${id}/`, { 
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token?.access}`,
        },
      });
      if (res.ok) {
        toast.success("Contract deleted");
        fetchContracts();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Could not delete. The contract might have active bids or assignments.");
      }
    } catch (err) {
      toast.error("System error during deletion");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.title ?? "").toLowerCase().includes(q) ||
      (c.category_display ?? "").toLowerCase().includes(q) ||
      (c.status_display ?? "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: contracts.length,
    open: contracts.filter((c) => c.status === "OPEN").length,
    completed: contracts.filter((c) => c.status === "COMPLETED").length,
    totalBudget: contracts.reduce((acc, curr) => acc + (parseFloat(curr.estimated_cost) || 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-8 animate-in fade-in duration-500 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#23251d] tracking-tight">
              Contracts <span className="text-[#F54E00]">Registry</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">Create and oversee educational infrastructure contracts.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#F54E00] text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-[#F54E00]/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            Create New Contract
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Contracts", val: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Open Bids", val: stats.open, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Completed", val: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Est. Cost", val: `₹${(stats.totalBudget / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-[#F54E00]", bg: "bg-orange-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#eeefe9] p-6 rounded-3xl border border-[#b6b7af] shadow-sm hover:shadow-md transition-shadow group">
              <div className={`p-4 rounded-xl w-fit ${stat.bg} ${stat.color} mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-[#23251d] mt-1">{stat.val}</h3>
            </div>
          ))}
        </div>

        {/* Main Table Area */}
        <div className="bg-[#eeefe9] rounded-[2.5rem] border border-[#b6b7af] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#b6b7af] flex flex-col md:flex-row gap-4 items-center justify-between bg-white/30">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea096]" size={18} />
              <input
                type="text"
                placeholder="Search contracts, category, status..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#b6b7af] rounded-2xl focus:border-[#F54E00] outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/10 uppercase text-[10px] font-black tracking-widest text-[#9ea096]">
                  <th className="p-6">Contract</th>
                  <th className="p-6">Category</th>
                  <th className="p-6">Est. Cost</th>
                  <th className="p-6">Bid Deadline</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <Loader2 className="w-8 h-8 text-[#F54E00] animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center font-bold text-[#9ea096]">No records found.</td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-white transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#23251d] group-hover:text-[#F54E00] transition-colors">
                            {contract.title}
                          </span>
                          <span className="text-[10px] font-bold text-[#9ea096] uppercase tracking-tighter">
                            {contract.school_name} · CON-{contract.id.toString().padStart(4, "0")}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-white border border-[#b6b7af] rounded-lg text-[10px] font-black uppercase tracking-widest text-[#4d4f46]">
                          {contract.category_display || contract.category}
                        </span>
                      </td>
                      <td className="p-6 text-sm font-black text-[#23251d]">
                        ₹{parseFloat(contract.estimated_cost).toLocaleString("en-IN")}
                      </td>
                      <td className="p-6 text-sm font-bold text-[#4d4f46]">
                        {contract.bid_end_date ? new Date(contract.bid_end_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => handleDelete(contract.id)}
                          disabled={isDeleting === contract.id}
                          className="p-3 text-[#9ea096] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                        >
                          {isDeleting === contract.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Contract Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-[#23251d]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-[#fdfdf8] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-[#b6b7af] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
              <div className="p-8 border-b border-[#b6b7af] flex items-center justify-between bg-white/50">
                <div>
                  <h2 className="text-2xl font-black text-[#23251d]">Create <span className="text-[#F54E00]">New Contract</span></h2>
                  <p className="text-xs text-[#9ea096] font-bold uppercase tracking-widest mt-1">Industrial Infrastructure Repair</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#eeefe9] rounded-xl transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* School Picker */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-[#F54E00]" /> Target School
                    </label>
                    <select 
                      required
                      value={formData.school}
                      onChange={(e) => setFormData({...formData, school: e.target.value})}
                      className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] outline-none focus:border-[#F54E00] transition-all"
                    >
                      <option value="">Select a school...</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.udise_code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                       Title
                    </label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g., Roof Leakage Repair in Block A"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] outline-none focus:border-[#F54E00] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                      <LayoutGrid className="w-3 h-3 text-[#F54E00]" /> Category
                    </label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] outline-none focus:border-[#F54E00] transition-all"
                    >
                      <option value="PLUMBING">Plumbing</option>
                      <option value="ELECTRICAL">Electrical</option>
                      <option value="STRUCTURAL">Structural</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                       Est. Cost (₹)
                    </label>
                    <input 
                      required
                      type="number"
                      placeholder="0.00"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})}
                      className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] outline-none focus:border-[#F54E00] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5 text-orange-600">
                      <AlertTriangle className="w-3 h-3" /> Priority
                    </label>
                    <select 
                      value={formData.priority_level}
                      onChange={(e) => setFormData({...formData, priority_level: e.target.value})}
                      className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] outline-none focus:border-[#F54E00] transition-all"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#F54E00]" /> Bid Deadline
                    </label>
                    <input 
                      required
                      type="date"
                      value={formData.bid_end_date}
                      onChange={(e) => setFormData({...formData, bid_end_date: e.target.value})}
                      className="w-full h-12 bg-white border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] outline-none focus:border-[#F54E00] transition-all"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-[#b6b7af]/30 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-[#eeefe9] text-[#23251d] rounded-xl font-black uppercase tracking-widest hover:bg-[#e2e3db] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-4 bg-[#F54E00] text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-[#F54E00]/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Create Contract
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
