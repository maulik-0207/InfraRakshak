"use client";

import { useEffect, useState } from "react";
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
  ChevronRight
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

export default function ReportsPage() {
  const [reports, setReports] = useState<DistrictReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DistrictReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

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

  const chartData = reports.slice(0, 6).reverse().map(r => ({
    name: new Date(r.week_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: Math.round(r.avg_score),
  }));

  const riskData = selectedReport ? [
    { label: "High Risk", val: selectedReport.high_risk_schools, color: "text-red-600", bg: "bg-red-50" },
    { label: "Medium Risk", val: selectedReport.medium_risk_schools, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Low Risk", val: selectedReport.low_risk_schools, color: "text-emerald-600", bg: "bg-emerald-50" },
  ] : [];

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-4 md:p-8 text-slate-900 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#23251d]">
              Insight <span className="text-[#F54E00]">Analytics</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">Generate comprehensive reports on district infrastructure progress.</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="h-14 px-6 bg-[#eeefe9] border border-[#b6b7af] rounded-2xl flex items-center gap-3 font-black text-[#23251d] hover:bg-white transition-all">
                <Calendar size={18} className="text-[#F54E00]" />
                {selectedReport ? `Week of ${new Date(selectedReport.week_start_date).toLocaleDateString()}` : "Select Period"}
             </button>
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
                        <Cell key={index} fill={index === chartData.length - 1 ? '#F54E00' : '#23251d'} />
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
                   District performance is relative to safety milestones met. Scores below 60% trigger automatic maintenance prioritization.
                 </p>
              </div>
            </div>

            {/* Side Stats */}
            <div className="space-y-6">
               {riskData.map((stat, i) => (
                  <div key={i} className="bg-[#eeefe9] rounded-[2rem] border border-[#b6b7af] p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0 border border-current border-opacity-10 group-hover:rotate-6 transition-transform`}>
                         <AlertTriangle size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.1em]">{stat.label}</p>
                         <h4 className="text-2xl font-black text-[#23251d]">{stat.val} <span className="text-[10px] text-[#9ea096] font-bold">Schools</span></h4>
                      </div>
                    </div>
                    <ChevronRight className="text-[#b6b7af] group-hover:text-[#F54E00] transition-colors" />
                  </div>
               ))}

               <div className="bg-[#23251d] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#F54E00] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <ShieldCheck className="text-[#F54E00]" />
                       <h4 className="text-lg font-black tracking-tight">District Status Overlay</h4>
                    </div>
                    <p className="text-white/60 text-xs font-bold leading-relaxed mb-6">
                      {selectedReport ? (
                        `${Math.round((selectedReport.low_risk_schools / selectedReport.total_schools) * 100)}% of schools in your district are currently verified as safe. ${selectedReport.high_risk_schools} facilities require mandatory structural inspection within 14 days.`
                      ) : "Awaiting district synchronization..."}
                    </p>
                    <button className="w-full h-12 bg-white text-[#23251d] font-black rounded-xl hover:bg-[#F54E00] hover:text-white transition-all shadow-lg text-xs uppercase tracking-widest">
                       DEPLOY AUDIT TEAM
                    </button>
                  </div>
               </div>
            </div>
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
