"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText, CheckCircle2, Clock, XCircle, MoreVertical, IndianRupee, Loader2 } from "lucide-react";

interface Contract {
  id: number;
  title: string;
  description: string;
  budget: string;
  status: string;
  deadline: string;
  school_name: string;
  district: string;
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

  const statusColors: any = {
    ACTIVE: "bg-blue-50 text-blue-600 border-blue-100",
    OPEN: "bg-amber-50 text-amber-600 border-amber-100",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    CANCELLED: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.school_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === "ACTIVE").length,
    completed: contracts.filter(c => c.status === "COMPLETED").length,
    totalBudget: contracts.reduce((acc, curr) => acc + (parseFloat(curr.budget.replace(/,/g, '')) || 0), 0)
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
            { label: "Total Managed", val: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Project", val: stats.active, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Finalized", val: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Budget", val: `₹${(stats.totalBudget / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-[#F54E00]", bg: "bg-orange-50" },
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
                placeholder="Search contracts or schools..." 
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
                  <th className="p-6">Contract Identifier</th>
                  <th className="p-6">Project Owner</th>
                  <th className="p-6">Budget</th>
                  <th className="p-6">Deadline</th>
                  <th className="p-6">Status</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="w-8 h-8 text-[#F54E00] animate-spin mx-auto" /><p className="mt-4 font-bold text-[#9ea096]">Loading contracts...</p></td></tr>
                ) : filteredContracts.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center font-bold text-[#9ea096]">No records found.</td></tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-white transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#23251d] group-hover:text-[#F54E00] transition-colors">{contract.title}</span>
                          <span className="text-[10px] font-bold text-[#9ea096] uppercase tracking-tighter">ID: CON-{contract.id.toString().padStart(4, '0')}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <School size={14} className="text-[#F54E00]" />
                          <span className="text-sm font-bold text-[#4d4f46]">{contract.school_name}</span>
                        </div>
                      </td>
                      <td className="p-6 text-sm font-black text-[#23251d]">₹{contract.budget}</td>
                      <td className="p-6 text-sm font-bold text-[#4d4f46]">{new Date(contract.deadline).toLocaleDateString()}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black border tracking-wider uppercase ${statusColors[contract.status as keyof typeof statusColors] || "bg-slate-50"}`}>
                          {contract.status}
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
            <p className="text-xs font-black text-[#9ea096] uppercase tracking-widest">Showing {filteredContracts.length} records</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function School({ size, className }: { size: number, className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5"></path>
    </svg>
  );
}
