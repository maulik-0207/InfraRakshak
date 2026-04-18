"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  ClipboardCheck, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Plus
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
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";

export default function SchoolDashboard() {
  const isMounted = useIsMounted();
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState({
    total_staff: 0,
    weekly_reports_submitted: 0,
    pending_reports: 0,
    overall_health_score: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/v1/accounts/dashboard/");
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#fdfdf8]" />;

  const chartData = [
    { name: "Week 1", score: 65 },
    { name: "Week 2", score: 72 },
    { name: "Week 3", score: 68 },
    { name: "Week 4", score: 85 },
  ];

  const KpiCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
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
        <h3 className="text-[#4d4f46] text-sm font-semibold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-3xl font-extrabold text-[#23251d]">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            School <span className="text-[#F54E00]">Overview</span>
          </h1>
          <p className="text-[#4d4f46] max-w-xl">
            Welcome back, <span className="font-bold">{user?.username || "Principal"}</span>. Monitor your school's infrastructure health and manage your reporting staff.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#F54E00] text-white px-6 py-3 rounded-lg font-bold shadow-[0_4px_0_0_#b17816] hover:translate-y-[-2px] active:translate-y-[2px] transition-all">
          <Plus className="w-5 h-5" /> Submit Weekly Report
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Staff" 
          value={stats.total_staff} 
          icon={Users} 
          color="bg-blue-600" 
        />
        <KpiCard 
          title="Reports Filed" 
          value={stats.weekly_reports_submitted} 
          icon={ClipboardCheck} 
          color="bg-[#F54E00]" 
          trend="+12%"
        />
        <KpiCard 
          title="Pending Tasks" 
          value={stats.pending_reports} 
          icon={AlertTriangle} 
          color="bg-amber-600" 
        />
        <KpiCard 
          title="Health Score" 
          value={`${stats.overall_health_score}%`} 
          icon={Activity} 
          color="bg-green-600" 
        />
      </div>

      {/* Charts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-[#23251d]">Infrastructure Health Trend</h2>
            <select className="bg-white border border-[#b6b7af] rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:border-[#F54E00]">
              <option>Last 4 Weeks</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b6b7af" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4d4f46', fontWeight: 600, fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4d4f46', fontWeight: 600, fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(245, 78, 0, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #b6b7af',
                    backgroundColor: '#eeefe9',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? "#F54E00" : "#23251d"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Recent Activity */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm flex flex-col">
          <h2 className="text-xl font-black text-[#23251d] mb-6">Recent Reports</h2>
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/50 border border-[#b6b7af] border-dashed hover:border-[#F54E00] transition-colors cursor-pointer group">
                <div className="bg-[#F54E00] bg-opacity-10 p-2 rounded-lg text-[#F54E00]">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#23251d] text-sm truncate">Weekly Inspection #04{i}</p>
                  <p className="text-xs text-[#4d4f46]">Submitted on April {10 + i}, 2024</p>
                </div>
                <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded">VERIFIED</span>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-3 text-sm font-black uppercase tracking-widest text-[#23251d] border-2 border-[#23251d] rounded-lg hover:bg-[#23251d] hover:text-white transition-all">
            View All Reports
          </button>
        </div>
      </div>
    </div>
  );
}
