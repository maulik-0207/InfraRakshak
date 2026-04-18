"use client";

import { useAuthStore } from "@/store/auth-store";
import { Gavel, MapPin, AlertCircle, Clock } from "lucide-react";

export default function ContractsPage() {
  const { role } = useAuthStore();

  const availableContracts = [
    { id: "CNT-001", title: "Electrical Transformer Repair", school: "Government High School #4", priority: "CRITICAL", created: "2 hours ago" },
    { id: "CNT-002", title: "Structural Crack Analysis", school: "Model Primary School", priority: "MEDIUM", created: "5 hours ago" },
    { id: "CNT-003", title: "Water Pipeline Rerouting", school: "District Girls School", priority: "HIGH", created: "Yesterday" },
    { id: "CNT-004", title: "Roofing Membrane Installation", school: "Technical Vocational Institute", priority: "LOW", created: "2 days ago" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#23251d]">
            Available <span className="text-[#F54E00]">Contracts</span>
          </h1>
          <p className="text-[#4d4f46] mt-1 font-medium">Browse infrastructure assignments posted by District Administrators (DEO).</p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {availableContracts.map((contract) => (
          <div key={contract.id} className="p-6 bg-[#eeefe9]/30 border border-[#bfc1b7] rounded-lg group hover:border-[#F54E00] hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-[#1e1f23] text-white px-2 py-0.5 rounded uppercase tracking-wider">{contract.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  contract.priority === "CRITICAL" ? "bg-red-100 text-red-600 border border-red-200" :
                  contract.priority === "HIGH" ? "bg-orange-100 text-orange-600 border border-orange-200" :
                  "bg-green-100 text-green-600 border border-green-200"
                }`}>
                  {contract.priority}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#23251d] group-hover:text-[#F54E00] transition-colors">{contract.title}</h2>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#65675e]">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#9ea096]" />
                  {contract.school}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#9ea096]" />
                  Posted {contract.created}
                </div>
              </div>
            </div>
            
            <button className="flex items-center justify-center gap-2 h-12 px-6 bg-[#1e1f23] text-white hover:text-[#F7A501] rounded-[4px] font-bold transition-all whitespace-nowrap active:scale-95 shadow-[0_2px_0_0_#b6b7af]">
              <Gavel size={18} />
              Place Bid
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
