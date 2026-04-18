"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText, CheckCircle2, Clock, MoreVertical, IndianRupee, Loader2 } from "lucide-react";

interface Contract {
  id: number;
  school: number;
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchContracts();
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
      console.error("Failed to fetch contracts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-50 text-blue-600 border-blue-100",
    OPEN: "bg-amber-50 text-amber-600 border-amber-100",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    CANCELLED: "bg-rose-50 text-rose-600 border-rose-100",
    AWARDED: "bg-purple-50 text-purple-600 border-purple-100",
    CLOSED: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-slate-50 text-slate-500 border-slate-200",
    MEDIUM: "bg-amber-50 text-amber-600 border-amber-100",
    HIGH: "bg-orange-50 text-orange-600 border-orange-100",
    CRITICAL: "bg-rose-50 text-rose-600 border-rose-100",
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
    totalBudget: contracts.reduce((acc, curr) => {
      return acc + (parseFloat(curr.estimated_cost) || 0);
    }, 0),
  };

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#23251d] tracking-tight">
              Contracts <span className="text-[#F54E00]">Management</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">Create and oversee educational infrastructure contracts.</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-[#F54E00] text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-[#F54E00]/20 transition-all active:scale-95">
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
                  <th className="p-6">Priority</th>
                  <th className="p-6">Status</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <Loader2 className="w-8 h-8 text-[#F54E00] animate-spin mx-auto" />
                      <p className="mt-4 font-bold text-[#9ea096]">Loading contracts...</p>
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center font-bold text-[#9ea096]">No records found.</td>
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
                            CON-{contract.id.toString().padStart(4, "0")} · School #{contract.school}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-sm font-semibold text-[#4d4f46]">
                        {contract.category_display || contract.category || "—"}
                      </td>
                      <td className="p-6 text-sm font-black text-[#23251d]">
                        ₹{parseFloat(contract.estimated_cost).toLocaleString("en-IN")}
                      </td>
                      <td className="p-6 text-sm font-bold text-[#4d4f46]">
                        {contract.bid_end_date
                          ? new Date(contract.bid_end_date).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-black border tracking-wider uppercase ${
                            priorityColors[contract.priority_level] ?? "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {contract.priority_display || contract.priority_level || "—"}
                        </span>
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-black border tracking-wider uppercase ${
                            statusColors[contract.status] ?? "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {contract.status_display || contract.status}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button className="p-2 hover:bg-[#eeefe9] rounded-lg transition-colors text-[#9ea096]">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-white/30 border-t border-[#b6b7af] flex items-center justify-between">
            <p className="text-xs font-black text-[#9ea096] uppercase tracking-widest">
              Showing {filteredContracts.length} of {contracts.length} contracts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
