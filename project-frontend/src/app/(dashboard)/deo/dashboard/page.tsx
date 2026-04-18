"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Download, 
  School, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Activity,
  Users,
  Briefcase
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { useAuthStore } from "@/store/auth-store";

export default function DeoDashboard() {
  const { user, token } = useAuthStore();
  console.log(user,token)
  const [stats, setStats] = useState<any>(null);
  const [districtReport, setDistrictReport] = useState<any>(null);
  const [priorityReports, setPriorityReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      setIsLoading(true);
      try {
        const [statsRes, districtRes, priorityRes] = await Promise.all([
          fetch("/api/v1/accounts/dashboard/"),
          fetch("/api/v1/predictions/district-reports/"),
          fetch("/api/v1/predictions/reports/")
        ]);

        console.log(statsRes)
        console.log(districtRes)
        console.log(priorityRes)         

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }

        if (districtRes.ok) {
          const data = await districtRes.json();
          setDistrictReport(data.results?.[0] || data[0]);
        }

        if (priorityRes.ok) {
          const data = await priorityRes.json();
          setPriorityReports(data.results || data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllData();
  }, []);

  const riskData = districtReport ? [
    { name: "High Risk", value: districtReport.high_risk_schools, color: "#ef4444" },
    { name: "Medium Risk", value: districtReport.medium_risk_schools, color: "#f59e0b" },
    { name: "Low Risk", value: districtReport.low_risk_schools, color: "#10b981" },
  ] : [];

  const KpiCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 rounded-full ${color}`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-[#4d4f46] text-xs font-black uppercase tracking-[0.15em] mb-1">{title}</h3>
        <p className="text-3xl font-black text-[#23251d]">{value ?? "..."}</p>
      </div>
    </div>
  );

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "HIGH": return "text-red-600 bg-red-50 border-red-100";
      case "MEDIUM": return "text-amber-600 bg-amber-50 border-amber-100";
      case "LOW": return "text-green-600 bg-green-50 border-green-100";
      default: return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            District <span className="text-[#F54E00]">Console</span>
          </h1>
          <p className="text-[#4d4f46]">
            Welcome back, <span className="font-bold">{user?.username || "Officer"}</span>. Overview of district-wide infrastructure health and school performance.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#eeefe9] border border-[#b6b7af] text-[#23251d] px-6 py-3 rounded-xl font-bold hover:bg-[#F54E00] hover:text-white transition-all">
            <Download className="w-5 h-5" /> Export Summary
          </button>
          <button className="flex items-center gap-2 bg-[#23251d] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#F54E00] transition-all">
            <Activity className="w-5 h-5" /> Run Risk Analysis
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Schools" 
          value={stats?.total_schools} 
          icon={School} 
          color="bg-blue-600" 
        />
        <KpiCard 
          title="Active Projects" 
          value={stats?.active_projects || stats?.open_contracts} 
          icon={Briefcase} 
          color="bg-[#F54E00]" 
          trend="+4"
        />
        <KpiCard 
          title="Pending Requests" 
          value={stats?.pending_registrations} 
          icon={ShieldAlert} 
          color="bg-amber-600" 
        />
        <KpiCard 
          title="District Score" 
          value={districtReport ? `${Math.round(districtReport.avg_score)}%` : "--"} 
          icon={Activity} 
          color="bg-green-600" 
        />
      </div>

      {/* Analytics & Priority Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Risk Analytics Chart */}
        <div className="lg:col-span-1 bg-[#eeefe9] border border-[#b6b7af] rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-black text-[#23251d] mb-8">Risk Distribution</h2>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData.length > 0 ? riskData : [{ name: "Loading", value: 1, color: "#b6b7af" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-8">
            {riskData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-bold text-[#4d4f46]">{item.name}</span>
                </div>
                <span className="text-sm font-black text-[#23251d]">{item.value} Schools</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Schools List */}
        <div className="lg:col-span-2 bg-[#eeefe9] border border-[#b6b7af] rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-8 border-b border-[#b6b7af] flex items-center justify-between bg-white/30">
            <h2 className="text-xl font-black text-[#23251d]">High Priority Actions</h2>
            <button className="text-xs font-black text-[#F54E00] uppercase tracking-widest hover:underline">View All Predictions</button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-[#9ea096] border-b border-[#b6b7af] bg-white/10">
                  <th className="p-6">School</th>
                  <th className="p-6">Risk Factor</th>
                  <th className="p-6">Score</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-[#9ea096] font-bold">Fetching analysis reports...</td></tr>
                ) : priorityReports.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-[#9ea096] font-bold">No structural reports available for this district.</td></tr>
                ) : (
                  priorityReports.slice(0, 5).map((report, i) => (
                    <tr key={i} className="hover:bg-white/50 transition-colors group">
                      <td className="p-6">
                        <div>
                          <p className="font-bold text-[#23251d]">School #{report.school}</p>
                          <p className="text-[10px] text-[#9ea096] font-bold uppercase">Rank #{report.priority_rank}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase ${getRiskColor(report.overall_risk_display)}`}>
                          {report.overall_risk_display}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-16 bg-white rounded-full overflow-hidden border border-[#b6b7af]/30">
                              <div className={`h-full transition-all duration-1000 ${report.overall_score < 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${report.overall_score}%` }} />
                           </div>
                           <span className="text-xs font-black text-[#23251d]">{Math.round(report.overall_score)}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button className="p-2 hover:bg-white rounded-lg text-[#9ea096] hover:text-[#F54E00] transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* District Pulse Section */}
      <div className="bg-[#23251d] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[#F54E00] opacity-10 rounded-full -mr-32 -mt-32 blur-3xl " />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="h-20 w-20 rounded-2xl bg-[#F54E00] flex items-center justify-center shadow-lg shadow-[#F54E00]/20 shrink-0">
               <Activity className="w-10 h-10" />
            </div>
            <div className="flex-1">
               <h3 className="text-2xl font-black mb-1">Predictive Maintenance Forecast</h3>
               <p className="text-white/60 max-w-2xl leading-relaxed italic">
                  "ML models suggest focusing structural audits on schools older than 25 years in the Coastal zone this month due to seismic fluctuations."
               </p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
               <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 md:flex-none md:w-32 text-center">
                  <p className="text-[10px] font-bold text-[#F54E00] uppercase mb-1">Alerts</p>
                  <p className="text-2xl font-black">12</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 md:flex-none md:w-32 text-center">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Forecast</p>
                  <p className="text-2xl font-black">8.5</p>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
