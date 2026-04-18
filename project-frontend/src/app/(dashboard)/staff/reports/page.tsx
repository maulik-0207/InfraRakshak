"use client";

import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { RefreshCw, FileText, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

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
}

function statusBadge(status: string) {
  const m: Record<string, string> = {
    SUBMITTED: "text-blue-700 bg-blue-50 border-blue-200",
    REVIEWED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    DRAFT: "text-amber-700 bg-amber-50 border-amber-200",
  };
  return m[status?.toUpperCase()] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

export default function ReportsListPage() {
  const isMounted = useIsMounted();
  const { data: reportsRaw, loading } = useApi<PaginatedResponse<WeeklyReport>>(
    `${API.reports.list}?ordering=-created_at&page_size=50`
  );

  if (!isMounted) return <div className="min-h-screen" />;

  const reports = reportsRaw?.results ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl">
      <div>
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
          All Weekly Reports
        </h1>
        <p className="text-[#4d4f46]">
          View and manage all your historical infrastructure reports.
        </p>
      </div>

      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#b6b7af]" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-[#9ea096]">
            <AlertCircle className="w-8 h-8 opacity-40" />
            <p className="text-sm font-semibold text-center">No reports found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#b6b7af]/30 bg-white/40">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/staff/reports/${r.id}`}
                className="flex items-center justify-between p-6 hover:bg-white transition-colors group block"
              >
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 bg-[#23251d]/5 rounded-xl flex items-center justify-center text-[#4d4f46] group-hover:text-[#F54E00] group-hover:bg-[#F54E00]/10 transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#23251d]">
                      Week of {new Date(r.week_start_date).toLocaleDateString("en-IN")}
                    </h3>
                    <p className="text-[11px] font-bold text-[#9ea096] uppercase mt-1 tracking-widest">
                      {r.submitted_at
                        ? `Submitted ${new Date(r.submitted_at).toLocaleDateString("en-IN")}`
                        : "Not submitted"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span
                    className={`text-[10px] font-black border px-3 py-1 rounded uppercase ${statusBadge(
                      r.status
                    )}`}
                  >
                    {r.status}
                  </span>
                  <ChevronRight className="w-5 h-5 text-[#9ea096] group-hover:text-[#F54E00] transform group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
