"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Plus,
  Zap,
  Droplets,
  Building2
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface WeeklyReport {
  id: number;
  week_start_date: string;
  week_end_date: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  status_display: string;
}

export default function SchoolReports() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/reports/weekly-reports/");
      if (res.ok) {
        const data = await res.json();
        setReports(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUBMITTED": return "bg-green-50 text-green-700 border-green-100";
      case "REVIEWED": return "bg-blue-50 text-blue-700 border-blue-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "REVIEWED": return <FileText className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            Weekly <span className="text-[#F54E00]">Reports</span>
          </h1>
          <p className="text-[#4d4f46]">
            Track and manage your weekly infrastructure health checkups.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#F54E00] text-white px-6 py-3 rounded-lg font-bold shadow-[0_4px_0_0_#b17816] hover:translate-y-[-2px] active:translate-y-[2px] transition-all">
          <Plus className="w-5 h-5" /> Generate Current Weekly Report
        </button>
      </div>

      {/* Main Content: Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Reports History */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xl font-black text-[#23251d] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#F54E00]" /> History
          </h2>

          {isLoading ? (
            <div className="p-10 text-center bg-[#eeefe9] rounded-2xl border border-[#b6b7af] border-dashed text-[#9ea096] font-bold">
              Fetching report history...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-10 text-center bg-[#eeefe9] rounded-2xl border border-[#b6b7af] border-dashed text-[#9ea096] font-bold">
              No reports found for your school yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="group flex items-center gap-4 p-5 bg-[#eeefe9] border border-[#b6b7af] rounded-xl hover:border-[#F54E00] transition-all cursor-pointer shadow-sm hover:shadow-md">
                  <div className="h-12 w-12 rounded-lg bg-white border border-[#b6b7af] flex items-center justify-center text-[#23251d] font-bold">
                    #{report.id.toString().padStart(3, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-[#23251d]">Report Week</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${getStatusStyle(report.status)}`}>
                        {getStatusIcon(report.status)} {report.status_display}
                      </span>
                    </div>
                    <p className="text-sm text-[#4d4f46]">
                      {new Date(report.week_start_date).toLocaleDateString()} — {new Date(report.week_end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9ea096] group-hover:text-[#F54E00] transform group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats & Checklist */}
        <div className="space-y-6">
          <div className="bg-[#1e1f23] rounded-2xl p-6 text-white shadow-xl">
             <h3 className="text-lg font-black mb-4">Submission Checklist</h3>
             <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm opacity-60">
                   <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3" />
                   </div>
                   <span>Electrical status verified</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-60">
                   <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                      <Droplets className="w-3 h-3" />
                   </div>
                   <span>Plumbing & Toilets checked</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-60">
                   <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-3 h-3" />
                   </div>
                   <span>Structural integrity confirmed</span>
                </li>
             </ul>
             <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs font-bold text-[#F54E00] uppercase tracking-widest mb-1">Upcoming Deadline</p>
                <p className="text-xl font-black">Sunday, 6:00 PM</p>
             </div>
          </div>

          <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6">
            <h3 className="text-sm font-black text-[#23251d] uppercase tracking-widest mb-4">Need Help?</h3>
            <p className="text-xs text-[#4d4f46] leading-relaxed mb-4">
              If you discover critical structural issues that aren't listed in the standard weekly checklist, please file an <strong>Emergency Alert</strong> immediately.
            </p>
            <button className="w-full py-2 text-xs font-black text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest">
              Raise Emergency Alert
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
