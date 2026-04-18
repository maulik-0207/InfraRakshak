"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  MapPin, 
  Clock, 
  IndianRupee, 
  ExternalLink,
  Gavel,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Contract {
  id: number;
  title: string;
  description: string;
  budget: string;
  status: string;
  deadline: string;
  school_name: string;
  district: string;
}

export default function AvailableContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/contracts/contracts/?status=OPEN");
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

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.school_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            Tender <span className="text-[#F54E00]">Marketplace</span>
          </h1>
          <p className="text-[#4d4f46]">
            Browse and bid on open infrastructure projects in your district.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea096] w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search tenders by school or project type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-xl pl-12 pr-4 outline-none focus:border-[#F54E00] transition-colors"
          />
        </div>
        <button className="h-12 px-6 border-2 border-[#b6b7af] rounded-xl flex items-center gap-2 font-bold text-[#4d4f46] hover:bg-[#eeefe9] transition-all">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
             <div key={i} className="h-64 bg-[#eeefe9] animate-pulse rounded-2xl border border-[#b6b7af]" />
          ))}
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="p-20 text-center bg-[#eeefe9] border border-[#b6b7af] border-dashed rounded-3xl">
           <AlertCircle className="w-12 h-12 text-[#9ea096] mx-auto mb-4" />
           <p className="font-black text-[#23251d]">No Open Tenders Found</p>
           <p className="text-[#4d4f46]">Please check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-[#F54E00] text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-[0.1em]">Open Tender</span>
                <span className="text-xs font-bold text-[#9ea096] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Ends {new Date(contract.deadline).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-[#23251d] mb-2 group-hover:text-[#F54E00] transition-colors line-clamp-2 min-h-[3.5rem] leading-tight">
                {contract.title}
              </h3>
              
              <div className="flex items-center gap-2 text-[#4d4f46] text-sm mb-4">
                <MapPin className="w-4 h-4 text-[#F54E00]" />
                <span className="truncate">{contract.school_name}, {contract.district}</span>
              </div>

              <div className="flex-1">
                 <p className="text-sm text-[#4d4f46] line-clamp-3 mb-6 bg-white/30 p-3 rounded-lg border border-[#b6b7af]/30 border-dashed italic">
                    {contract.description || "Infrastructure renovation project including structural reinforcements and electrical upgrades."}
                 </p>
              </div>

              <div className="pt-6 border-t border-[#b6b7af] flex items-center justify-between mt-auto">
                 <div>
                    <p className="text-[10px] font-bold text-[#9ea096] uppercase tracking-[0.1em]">ESTIMATED VALUE</p>
                    <p className="font-extrabold text-[#23251d] text-lg">₹{contract.budget}</p>
                 </div>
                 <button className="bg-[#23251d] text-white p-3 rounded-xl hover:bg-[#F54E00] shadow-[0_4px_0_0_#151619] active:translate-y-[2px] active:shadow-none transition-all group/btn">
                    <Gavel className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guidance Section */}
      <div className="bg-[#1e1f23] rounded-3xl p-8 text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="h-16 w-16 rounded-2xl bg-[#F54E00] flex items-center justify-center shrink-0 shadow-lg shadow-[#F54E00]/20">
               <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
               <h3 className="text-2xl font-black mb-2">Verified Opportunity Guarantee</h3>
               <p className="text-white/70 max-w-2xl leading-relaxed">
                  Every tender listed here has been pre-authorized by district education officers and is backed by guaranteed government funding. Payment milestones are automated via structural proof verification.
               </p>
            </div>
            <button className="mt-4 md:mt-0 md:ml-auto px-8 py-4 bg-white text-[#1e1f23] font-black rounded-xl hover:bg-[#F54E00] hover:text-white transition-all whitespace-nowrap">
               View T&C
            </button>
         </div>
      </div>
    </div>
  );
}
