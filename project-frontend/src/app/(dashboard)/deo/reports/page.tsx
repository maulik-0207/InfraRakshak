"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Calendar, 
  Download, 
  FileText, 
  TrendingUp, 
  Filter, 
  BarChart3, 
  PieChart, 
  Activity, 
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ChevronRight,
  School,
  X
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

interface DistrictReport {
  id: number;
  district: string;
  week_start_date: string;
  week_end_date: string;
  total_schools: number;
  high_risk_schools: number;
  medium_risk_schools: number;
  low_risk_schools: number;
  avg_score: number;
  generated_at: string;
}

interface FilteredSchool {
  id: number;
  school_id: number;
  school_name: string;
  district: string;
  udise_code: string;
  overall_score: number;
  overall_risk_level: string;
  priority_rank: number;
  generated_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<DistrictReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DistrictReport | null>(null);
  
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<"HIGH" | "MEDIUM" | "LOW" | null>(null);
  const [filteredSchools, setFilteredSchools] = useState<FilteredSchool[]>([]);
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      fetchFilteredSchools(selectedReport.id, selectedRiskLevel);
    }
  }, [selectedRiskLevel, selectedReport]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/predictions/district-reports/");
      if (res.ok) {
        const data = await res.json();
        const results = data.results || data;
        setReports(results);
        if (results.length > 0) {
          setSelectedReport(results[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch district reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredSchools = async (reportId: number, riskLevel: string | null) => {
    setIsSchoolsLoading(true);
    try {
      const url = new URL(`/api/v1/predictions/district-reports/${reportId}/schools/`, window.location.origin);
      if (riskLevel) {
        url.searchParams.append("risk_level", riskLevel);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        setFilteredSchools(await res.json());
        if (riskLevel && tableRef.current && !isSchoolsLoading) {
            setTimeout(() => {
                tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSchoolsLoading(false);
    }
  };

  const handleRiskClick = (level: "HIGH" | "MEDIUM" | "LOW") => {
    if (selectedRiskLevel === level) {
      setSelectedRiskLevel(null);
    } else {
      setSelectedRiskLevel(level);
    }
  };

  const chartData = [...reports].sort((a,b) => new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime()).slice(-6).map(r => ({
    name: new Date(r.week_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: Math.round(r.avg_score),
    isCurrent: r.id === selectedReport?.id
  }));

  const riskData: Array<{label: string, val: number, level: "HIGH" | "MEDIUM" | "LOW", color: string, bg: string, border: string}> = selectedReport ? [
    { label: "High Risk", val: selectedReport.high_risk_schools, level: "HIGH", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
    { label: "Medium Risk", val: selectedReport.medium_risk_schools, level: "MEDIUM", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Low Risk", val: selectedReport.low_risk_schools, level: "LOW", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  ] : [];

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-4 md:p-8 text-slate-900 animate-in fade-in duration-500 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#23251d]">
              Insight <span className="text-[#F54E00]">Analytics</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">Generate comprehensive reports on district infrastructure progress.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="h-14 px-6 bg-[#eeefe9] border border-[#b6b7af] rounded-2xl flex items-center gap-3 font-black text-[#23251d] hover:bg-white transition-all">
                  <Calendar size={18} className="text-[#F54E00]" />
                  {selectedReport ? `Week of ${new Date(selectedReport.week_start_date).toLocaleDateString()}` : "Select Period"}
               </button>
               {isDropdownOpen && (
                 <div className="absolute top-16 right-0 w-72 bg-white border border-[#b6b7af] rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                   {reports.map((r, idx) => (
                     <button
                       key={idx}
                       onClick={() => { setSelectedReport(r); setIsDropdownOpen(false); setSelectedRiskLevel(null); }}
                       className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#eeefe9] border-b border-[#b6b7af]/30 last:border-b-0 transition-colors"
                     >
                       <span className={`font-bold text-sm ${selectedReport?.id === r.id ? 'text-[#F54E00]' : 'text-[#23251d]'}`}>
                           Week of {new Date(r.week_start_date).toLocaleDateString()}
                       </span>
                       {selectedReport?.id === r.id && <CheckCircle2 className="w-5 h-5 text-[#F54E00]" />}
                     </button>
                   ))}
                 </div>
               )}
             </div>
             
             <button className="h-14 px-8 bg-[#23251d] text-white font-black rounded-2xl shadow-xl hover:bg-[#F54E00] transition-all flex items-center gap-2">
                <Download size={18} />
                Export Archive
             </button>
          </div>
        </header>

        {isLoading ? (
          <div className="p-40 text-center">
            <Loader2 className="w-16 h-16 text-[#F54E00] animate-spin mx-auto" />
            <p className="mt-4 font-black text-[#9ea096] uppercase tracking-[0.2em]">Aggregating District Intelligence...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart Container */}
            <div className="lg:col-span-2 bg-[#eeefe9] rounded-[2.5rem] border border-[#b6b7af] shadow-sm p-8 flex flex-col">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-2xl font-black tracking-tight text-[#23251d]">Health Score Trends</h3>
                    <p className="text-[#9ea096] text-[10px] font-black uppercase tracking-widest mt-1">District average across reported weeks</p>
                 </div>
              </div>

              <div className="h-[300px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b6b7af" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ea096', fontSize: 10, fontWeight: 900 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ea096', fontSize: 10, fontWeight: 900 }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      cursor={{ fill: '#ffffff', opacity: 0.5 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.isCurrent ? '#F54E00' : '#23251d'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center gap-8 pt-6 border-t border-[#b6b7af]/30">
                 <div className="flex items-center gap-4 border-r border-[#b6b7af]/30 pr-8">
                    <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-wider">Avg Score</p>
                       <p className="text-xl font-black text-[#23251d]">{selectedReport ? Math.round(selectedReport.avg_score) : 0}%</p>
                    </div>
                 </div>
                 <p className="text-xs font-bold text-[#4d4f46] leading-relaxed max-w-md italic">
                   District performance is relative to safety milestones met. Click on the risk trackers to identify actionable targets.
                 </p>
              </div>
            </div>

            {/* Side Stats */}
            <div className="space-y-6">
               {riskData.map((stat, i) => {
                  const isActive = selectedRiskLevel === stat.level;
                  return (
                    <button 
                       key={i} 
                       onClick={() => handleRiskClick(stat.level)}
                       className={`w-full relative overflow-hidden rounded-[2rem] border p-6 flex flex-col justify-between shadow-sm hover:-translate-y-1 transition-all group ${
                         isActive 
                           ? `bg-white border-[#23251d] ring-4 ring-[#23251d]/10` 
                           : `bg-white border-[#b6b7af] hover:border-[#23251d]/50`
                       }`}
                    >
                      {isActive && <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full -mr-10 -mt-10 blur-2xl z-0`} />}
                      <div className="relative z-10 w-full flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className={`h-14 w-14 ${stat.bg} ${stat.color} ${stat.border} rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform`}>
                              <AlertTriangle size={24} />
                           </div>
                           <div className="text-left">
                              <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.1em] mb-1">{stat.label}</p>
                              <h4 className="text-2xl font-black text-[#23251d] leading-none">{stat.val} <span className="text-[10px] text-[#9ea096] font-bold">Schools</span></h4>
                           </div>
                         </div>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isActive ? 'bg-[#23251d] text-white border-[#23251d]' : 'bg-[#eeefe9] text-[#9ea096] border-[#b6b7af]'}`}>
                           {isActive ? <X size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
                         </div>
                      </div>
                    </button>
                  );
               })}

               <div className="bg-[#23251d] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#F54E00] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <ShieldCheck className="text-[#F54E00]" />
                          <h4 className="text-lg font-black tracking-tight">District Overlay</h4>
                       </div>
                    </div>
                    <p className="text-white/60 text-xs font-bold leading-relaxed mb-6">
                      {selectedReport && selectedReport.total_schools > 0 ? (
                        `${Math.round((selectedReport.low_risk_schools / selectedReport.total_schools) * 100)}% of schools in your district are currently verified as safe. Review actionable reports for high risk profiles.`
                      ) : "Awaiting district synchronization..."}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Dynamic Drill Down Table */}
        {!isLoading && selectedReport && (selectedRiskLevel || filteredSchools.length > 0) && (
          <div ref={tableRef} className="bg-white border border-[#b6b7af] rounded-[2.5rem] p-8 mt-12 shadow-sm animate-in slide-in-from-bottom-8 duration-500">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-[#23251d] flex items-center gap-3">
                    <Filter className="w-6 h-6 text-[#F54E00]" />
                    {selectedRiskLevel ? `${selectedRiskLevel} Risk Schools` : "All Tracked Schools"}
                  </h3>
                  <p className="text-sm font-bold text-[#9ea096] mt-2">
                    Week of {new Date(selectedReport.week_start_date).toLocaleDateString()}
                  </p>
                </div>
                 <span className="bg-[#eeefe9] border border-[#b6b7af] px-4 py-2 rounded-xl text-xs font-black text-[#4d4f46] uppercase tracking-widest">
                    {filteredSchools.length} Result{filteredSchools.length !== 1 && 's'}
                 </span>
             </div>

             {isSchoolsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center border-t border-[#b6b7af]/30">
                  <Loader2 className="w-10 h-10 text-[#F54E00] animate-spin mb-4" />
                  <p className="font-bold text-[#9ea096]">Fetching report details...</p>
                </div>
             ) : filteredSchools.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border-t border-[#b6b7af]/30">
                  <AlertTriangle className="w-12 h-12 text-[#9ea096] mb-4 opacity-50" />
                  <p className="font-bold text-[#23251d] text-lg">No schools found</p>
                  <p className="text-sm text-[#9ea096] mt-1">There are no schools matching this risk profile for the selected week.</p>
                </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-[#b6b7af] text-[#9ea096] text-[10px] font-black uppercase tracking-[0.1em]">
                           <th className="pb-4 pl-4">School</th>
                           <th className="pb-4">District</th>
                           <th className="pb-4">Priority Rank</th>
                           <th className="pb-4">Risk Level</th>
                           <th className="pb-4 text-right pr-4">Safety Score</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#b6b7af]/30">
                        {filteredSchools.map((school) => (
                           <tr key={school.id} className="hover:bg-[#eeefe9]/50 transition-colors group">
                             <td className="py-6 pl-4">
                                <div className="flex items-center gap-4">
                                   <div className="h-12 w-12 rounded-xl bg-[#23251d] flex items-center justify-center text-white shrink-0">
                                      <School className="w-5 h-5" />
                                   </div>
                                   <div>
                                      <p className="font-black text-[#23251d]">{school.school_name}</p>
                                      <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mt-1">UDISE: {school.udise_code}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-6 font-bold text-[#4d4f46] text-sm">{school.district}</td>
                             <td className="py-6">
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-[#b6b7af] flex items-center justify-center font-black text-[#23251d] text-xs">
                                     #{school.priority_rank}
                                  </div>
                               </div>
                             </td>
                             <td className="py-6">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border
                                   ${school.overall_risk_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 
                                     school.overall_risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                     'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                   {school.overall_risk_level}
                                </span>
                             </td>
                             <td className="py-6 text-right pr-4">
                                <p className="font-black text-xl text-[#23251d]">{Math.round(school.overall_score)}<span className="text-sm text-[#9ea096]">%</span></p>
                             </td>
                           </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShieldCheck({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  );
}
