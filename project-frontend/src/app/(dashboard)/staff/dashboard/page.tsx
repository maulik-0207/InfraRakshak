"use client";

import { useEffect, useState } from "react";
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    reports_submitted: 0,
    pending_tasks: 0,
    last_report_date: "---"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Staff-specific stats or shared dashboard endpoint
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/v1/accounts/dashboard/");
        if (res.ok) {
          const data = await res.json();
          setStats({
            reports_submitted: data.stats?.weekly_reports_submitted || 0,
            pending_tasks: data.stats?.pending_reports || 0,
            last_report_date: data.stats?.last_report_date || "2024-04-12"
          });
        }
      } catch (err) {
        console.error("Dashboard stats failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#23251d] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F54E00] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <p className="text-[#F54E00] font-black uppercase tracking-widest text-[10px] mb-2">Reporting Staff Hub</p>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Welcome, <span className="text-[#F54E00]">{user?.username || "Inspector"}</span>
          </h1>
          <p className="text-white/60 max-w-md">
            Your task is to submit weekly infrastructure status reports for verification. Accuracy ensures timely maintenance.
          </p>
        </div>
        <button className="relative z-10 flex items-center gap-2 bg-[#F54E00] text-white px-8 h-14 rounded-2xl font-black shadow-lg shadow-[#F54E00]/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-5 h-5" /> Start Weekly Report
        </button>
      </div>

      {/* Simplified Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[ 
            { label: "My Submissions", val: stats.reports_submitted, icon: ClipboardCheck, color: "text-blue-600" },
            { label: "Pending Reviews", val: stats.pending_tasks, icon: Clock, color: "text-amber-600" },
            { label: "Last Verified", val: stats.last_report_date, icon: CheckCircle2, color: "text-green-600" }
         ].map((s, i) => (
            <div key={i} className="bg-[#eeefe9] border border-[#b6b7af] p-6 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-[#F54E00] transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg bg-white ${s.color}`}>
                     <s.icon className="w-6 h-6" />
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-2xl font-black text-[#23251d]">{s.val}</p>
               </div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Instructions */}
         <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl p-8 relative overflow-hidden">
            <h2 className="text-xl font-black text-[#23251d] mb-6 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-[#F54E00]" /> Instructions
            </h2>
            <div className="space-y-6 relative z-10">
               <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[#1e1f23] text-white flex items-center justify-center font-black text-xs shrink-0">1</div>
                  <p className="text-sm text-[#4d4f46] leading-relaxed">Visit all sanitation blocks and electrical panels every Friday to assess condition.</p>
               </div>
               <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[#1e1f23] text-white flex items-center justify-center font-black text-xs shrink-0">2</div>
                  <p className="text-sm text-[#4d4f46] leading-relaxed">Log functional vs non-functional fixtures accurately in the Weekly Report form.</p>
               </div>
               <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[#1e1f23] text-white flex items-center justify-center font-black text-xs shrink-0">3</div>
                  <p className="text-sm text-[#4d4f46] leading-relaxed">Submit the report before Sunday 6:00 PM for DEO verification and scoring.</p>
               </div>
            </div>
            <div className="absolute -bottom-8 -right-8 opacity-5">
               <ClipboardCheck className="w-48 h-48 rotate-12" />
            </div>
         </div>

         {/* Recent Submissions */}
         <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-black text-[#23251d]">My Recent Activity</h2>
               <button className="text-xs font-black text-[#F54E00] hover:underline">VIEW ALL</button>
            </div>
            {[1, 2, 3].map(i => (
               <div key={i} className="bg-white border border-[#b6b7af] p-4 rounded-xl flex items-center justify-between group hover:border-[#F54E00] cursor-pointer transition-all">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-[#eeefe9] rounded-lg flex items-center justify-center text-[#9ea096] group-hover:text-[#F54E00] transition-colors">
                        <FileText className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-[#23251d]">Report Week #0{i}</p>
                        <p className="text-[10px] text-[#9ea096] font-bold uppercase">April {10 + i}, 2024</p>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9ea096] group-hover:text-[#F54E00] transform group-hover:translate-x-1 transition-all" />
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
