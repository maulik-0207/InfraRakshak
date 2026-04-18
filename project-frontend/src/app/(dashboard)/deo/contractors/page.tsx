"use client";

import { useEffect, useState } from "react";
import { Users, Search, Award, Star, ExternalLink, Filter, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";

interface Contractor {
  id: number;
  company_name: string;
  email: string;
  license_number: string;
  phone_no: string;
  user: number;
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/accounts/profiles/contractors/");
      if (res.ok) {
        const data = await res.json();
        setContractors(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch contractors", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContractors = contractors.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.license_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-8 text-slate-900 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#23251d]">
              Verified <span className="text-[#F54E00]">Contractors</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">Directory of approved partners for educational infrastructure projects.</p>
          </div>
          <div className="flex gap-3">
             <div className="relative w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea096]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or license..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-[#eeefe9] border border-[#b6b7af] rounded-xl focus:border-[#F54E00] outline-none transition-all font-bold text-sm"
                />
             </div>
             <button className="h-12 w-12 bg-[#eeefe9] border border-[#b6b7af] rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-sm">
                <Filter size={20} className="text-[#4d4f46]" />
             </button>
          </div>
        </div>

        {/* Grid Area */}
        {isLoading ? (
          <div className="p-20 text-center">
             <Loader2 className="w-12 h-12 text-[#F54E00] animate-spin mx-auto" />
             <p className="mt-4 font-black text-[#9ea096] uppercase tracking-widest">Scanning Registry...</p>
          </div>
        ) : filteredContractors.length === 0 ? (
          <div className="p-20 text-center bg-[#eeefe9] rounded-[2.5rem] border-2 border-dashed border-[#b6b7af]">
             <p className="font-bold text-[#9ea096]">No contractors found in your district.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {filteredContractors.map((contractor) => (
              <div key={contractor.id} className="bg-[#eeefe9] border border-[#b6b7af] rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-[#F54E00] transition-all group flex flex-col md:flex-row gap-8">
                <div className="h-32 w-32 rounded-3xl bg-white flex-shrink-0 flex items-center justify-center p-6 border border-[#b6b7af]/30 group-hover:bg-[#23251d] transition-all">
                  <div className="h-full w-full rounded-xl flex items-center justify-center">
                    <span className="text-3xl font-black text-[#F54E00] group-hover:text-white transition-colors uppercase">
                      {contractor.company_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-[#23251d] group-hover:text-[#F54E00] transition-colors">{contractor.company_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.15em]">License:</span>
                         <span className="text-xs font-black text-[#4d4f46]">{contractor.license_number}</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-full border border-green-100">
                       <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-2 text-sm font-bold text-[#4d4f46]">
                        <Mail size={16} className="text-[#F54E00]" />
                        <span className="truncate">{contractor.email}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm font-bold text-[#4d4f46]">
                        <Phone size={16} className="text-[#F54E00]" />
                        <span>{contractor.phone_no}</span>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-[#b6b7af]/50 mt-2">
                    <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.2em]">Partner ID: CNT-{contractor.id.toString().padStart(4, '0')}</span>
                    <button className="inline-flex items-center gap-2 text-xs font-black text-[#23251d] hover:text-[#F54E00] transition-colors group/btn">
                      VIEW FULL PORTFOLIO
                      <ExternalLink size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-[#23251d] rounded-[2.5rem] p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden mt-12">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[#F54E00] opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div className="relative z-10">
              <h4 className="text-3xl font-black tracking-tight">Expand the Network</h4>
              <p className="text-white/60 mt-4 font-semibold max-w-xl text-lg leading-relaxed">
                Registered vendors go through a rigorous structural quality audit before being allowed to bid on major district school projects.
              </p>
           </div>
           <div className="flex gap-4 shrink-0 relative z-10 w-full lg:w-auto">
              <button className="flex-1 lg:flex-none h-14 px-10 bg-[#F54E00] text-white font-black rounded-2xl hover:bg-white hover:text-[#23251d] transition-all shadow-xl shadow-[#F54E00]/20">
                Partner Portals
              </button>
              <button className="flex-1 lg:flex-none h-14 px-10 bg-white/10 border border-white/20 text-white font-black rounded-2xl hover:bg-white/20 transition-all">
                Download Terms
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
