"use client";

import { useEffect, useState } from "react";
import { 
  Briefcase, 
  Gavel, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  IndianRupee,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";

export default function ContractorDashboard() {
  const isMounted = useIsMounted();
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState({
    total_bids: 0,
    active_projects: 0,
    completed_projects: 0,
    total_earned: 0
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

  const data = [
    { name: "Jan", revenue: 4000 },
    { name: "Feb", revenue: 3000 },
    { name: "Mar", revenue: 5000 },
    { name: "Apr", revenue: 4500 },
    { name: "May", revenue: 6000 },
    { name: "Jun", revenue: 5500 },
  ];

  const KpiCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${color} opacity-5 group-hover:scale-125 transition-transform duration-500`} />
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-white border border-[#b6b7af]/30 ${color.replace('bg-', 'text-')}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> +5.2%
        </div>
      </div>
      <h3 className="text-xs font-black text-[#9ea096] uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-3xl font-black text-[#23251d]">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            Contractor <span className="text-[#F54E00]">Console</span>
          </h1>
          <p className="text-[#4d4f46]">
            Welcome back, <span className="font-bold">{user?.username || "Partner"}</span>. Monitor your active bids and manage upcoming infrastructure works.
          </p>
        </div>
        <div className="flex gap-3">
           <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-xl px-6 py-3 flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest">Total Earnings</p>
                 <p className="text-xl font-black text-[#23251d]">₹{stats.total_earned.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-600/10 flex items-center justify-center text-green-600">
                 <IndianRupee className="w-6 h-6" />
              </div>
           </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Active Bids" value={stats.total_bids} icon={Gavel} color="bg-amber-600" />
        <KpiCard title="Ongoing Projects" value={stats.active_projects} icon={Briefcase} color="bg-[#F54E00]" />
        <KpiCard title="Jobs Completed" value={stats.completed_projects} icon={CheckCircle2} color="bg-green-600" />
        <KpiCard title="SLA Compliance" value="98%" icon={ShieldCheck} color="bg-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Projection */}
        <div className="lg:col-span-2 bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-[#23251d]">Revenue Trend</h2>
              <div className="flex gap-2">
                 <span className="w-3 h-3 rounded-full bg-[#F54E00]" />
                 <span className="text-xs font-bold text-[#4d4f46]">Monthly Forecast</span>
              </div>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data}>
                    <defs>
                       <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F54E00" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#F54E00" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b6b7af" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4d4f46', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#4d4f46', fontSize: 12}} />
                    <Tooltip 
                       contentStyle={{backgroundColor: '#fdfdf8', borderRadius: '12px', border: '1px solid #b6b7af'}}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#F54E00" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Current Opportunities */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#23251d]">Open Tenders</h2>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded">8 NEW</span>
           </div>
           
           <div className="flex-1 space-y-4">
              {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white/50 border border-[#b6b7af] p-4 rounded-xl hover:border-[#F54E00] transition-all cursor-pointer group">
                    <p className="text-[10px] font-black text-[#9ea096] uppercase mb-1">DHARAVI DISTRICT</p>
                    <h4 className="font-bold text-[#23251d] mb-2 group-hover:text-[#F54E00] transition-colors">School Cluster C-0{i} Renovation</h4>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-[#4d4f46]">Budget: ₹1.2Cr</span>
                       <button className="p-1 px-3 bg-[#23251d] text-white rounded text-[10px] font-black uppercase hover:bg-[#F54E00] transition-colors">Apply</button>
                    </div>
                 </div>
              ))}
           </div>

           <button className="mt-8 w-full py-3 bg-white border border-[#b6b7af] rounded-xl text-sm font-black text-[#23251d] hover:bg-[#eeefe9] transition-all flex items-center justify-center gap-2">
              Browse Marketplace <ChevronRight className="w-4 h-4" />
           </button>
        </div>

      </div>

      {/* Active Projects Tracker */}
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
         <h2 className="text-xl font-black text-[#23251d] mb-8">Active Work Proofs Status</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[ 
               { label: "Phase 1: Foundation", pct: 100, status: "COMPLETE" },
               { label: "Phase 2: Electrical", pct: 65, status: "ONGOING" },
               { label: "Phase 3: Finishing", pct: 0, status: "PENDING" }
            ].map((p, i) => (
               <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-xs font-black text-[#9ea096] uppercase tracking-widest mb-1">{p.status}</p>
                        <p className="font-bold text-[#23251d]">{p.label}</p>
                     </div>
                     <span className="text-sm font-black text-[#F54E00]">{p.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                     <div className="h-full bg-[#F54E00] transition-all duration-1000" style={{ width: `${p.pct}%` }} />
                  </div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
}
