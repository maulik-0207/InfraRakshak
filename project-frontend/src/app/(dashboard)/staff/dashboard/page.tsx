"use client";

import {
  ClipboardCheck,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  FileText,
  Plus,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  role: string;
  email: string;
  stats: {
    weekly_reports_submitted?: number;
    pending_reports?: number;
  };
}

interface WeeklyReport {
  id: number;
  school: number;
  week_start_date: string;
  week_end_date?: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const m: Record<string, string> = {
    SUBMITTED: "text-blue-700 bg-blue-50 border-blue-200",
    REVIEWED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    DRAFT: "text-amber-700 bg-amber-50 border-amber-200",
  };
  return m[status?.toUpperCase()] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

function Spinner() {
  return (
    <div className="py-12 flex justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-[#b6b7af]" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const isMounted = useIsMounted();
  const { user } = useAuthStore();

  const { data: dashData, loading: dashLoading } = useApi<DashboardStats>(API.dashboard);
  const { data: reportsRaw, loading: reportsLoading } = useApi<
    PaginatedResponse<WeeklyReport>
  >(`${API.reports.list}?ordering=-created_at&page_size=5`);

  const stats = dashData?.stats;
  const reports = reportsRaw?.results ?? [];

  // Define current week starting Monday for comparison
  const now = new Date();
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  currentMonday.setHours(0, 0, 0, 0);

  const draftReport = reports.find((r) => {
    if (r.status !== "DRAFT") return false;
    const reportDate = new Date(r.week_start_date);
    reportDate.setHours(0, 0, 0, 0);
    return reportDate.getTime() === currentMonday.getTime();
  });

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl">
      {/* Hero Header */}
      <div className="bg-[#23251d] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F54E00] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[#F54E00] font-black uppercase tracking-widest text-[10px] mb-2">
              Reporting Staff Hub
            </p>
            <h1 className="text-3xl font-black tracking-tight mb-1">
              Welcome, <span className="text-[#F54E00]">{user?.email ?? "Inspector"}</span>
            </h1>
            <p className="text-white/60 max-w-md text-sm">
              Submit weekly infrastructure status reports for your school. Accuracy ensures timely maintenance.
            </p>
          </div>
          {reportsLoading ? (
            <div className="h-10 w-40 bg-white/10 rounded animate-pulse" />
          ) : draftReport ? (
            <Link
              href={`/staff/reports/${draftReport.id}`}
              className="relative z-10 flex items-center gap-2 bg-[#F54E00] text-white px-7 py-3 rounded-2xl font-black shadow-lg shadow-[#F54E00]/20 hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <FileText className="w-5 h-5" /> Continue Pending Report
            </Link>
          ) : (
            <div className="relative z-10 px-6 py-3 bg-white/10 rounded-2xl text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Pending Reports
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards — only visible if API returned data */}
      {(dashLoading || stats) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              label: "My Submissions",
              val: dashLoading ? null : stats?.weekly_reports_submitted,
              icon: ClipboardCheck,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Pending Reviews",
              val: dashLoading ? null : stats?.pending_reports,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#eeefe9] border border-[#b6b7af] p-6 rounded-2xl shadow-sm flex items-center gap-5 group hover:border-[#F54E00] transition-all"
            >
              <div className={`p-3 rounded-xl ${s.bg} shrink-0`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-0.5">
                  {s.label}
                </p>
                {dashLoading ? (
                  <div className="h-8 w-16 bg-[#b6b7af]/30 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-black text-[#23251d]">
                    {s.val ?? <span className="text-[#b6b7af] text-xl">—</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#23251d]">My Recent Reports</h2>
          </div>

          {reportsLoading ? (
            <Spinner />
          ) : reports.length === 0 ? (
            <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 flex flex-col items-center gap-3 text-[#9ea096]">
              <AlertCircle className="w-8 h-8 opacity-40" />
              <p className="text-sm font-semibold text-center">
                You haven't submitted any reports yet. Click "Start Weekly Report" above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Link
                  key={r.id}
                  href={`/staff/reports/${r.id}`}
                  className="bg-white border border-[#b6b7af] p-4 rounded-xl flex items-center justify-between group hover:border-[#F54E00] cursor-pointer transition-all block"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#eeefe9] rounded-lg flex items-center justify-center text-[#9ea096] group-hover:text-[#F54E00] transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#23251d]">
                        Week of {new Date(r.week_start_date).toLocaleDateString("en-IN")}
                      </p>
                      <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase ${statusBadge(r.status)} mt-1 inline-block`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9ea096] group-hover:text-[#F54E00] transform group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl p-8 relative overflow-hidden">
          <h2 className="text-xl font-black text-[#23251d] mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#F54E00]" /> Reporting Guide
          </h2>
          <div className="space-y-5">
            {[
              "Visit all sanitation blocks and electrical panels every Friday to assess their condition.",
              "Log functional vs non-functional fixtures accurately in the Weekly Report form.",
              "Submit the completed report before Sunday 6:00 PM for DEO review and scoring.",
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-[#23251d] text-white flex items-center justify-center font-black text-xs shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-[#4d4f46] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-8 -right-8 opacity-5">
            <ClipboardCheck className="w-48 h-48 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
