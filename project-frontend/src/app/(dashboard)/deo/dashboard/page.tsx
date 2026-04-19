"use client";

import { useState, useRef } from "react";
import {
  School,
  Briefcase,
  Activity,
  Users,
  Trash2,
  Upload,
  ChevronRight,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  role: string;
  email: string;
  stats: {
    total_schools?: number;
    active_contracts?: number;
    pending_bids?: number;
  };
}

interface DistrictReport {
  id: number;
  district: string;
  week_start_date: string;
  avg_score: number;
  high_risk_schools: number;
  medium_risk_schools: number;
  low_risk_schools: number;
  total_schools: number;
}

interface PredictionReport {
  id: number;
  school: number;
  school_name?: string;
  overall_score: number;
  overall_risk_level: string;
  priority_rank: number;
  generated_at: string;
}

interface AdminStaffProfile {
  id: number;
  user: number;
  email: string;
  full_name: string;
  phone_no: string;
  parent_deo?: number;
  created_at: string;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRiskColors(level: string) {
  switch (level?.toUpperCase()) {
    case "HIGH":
    case "CRITICAL":
      return "text-red-600 bg-red-50 border-red-200";
    case "MEDIUM":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "LOW":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div
        className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${accent}`}
      />
      <div className={`p-3 rounded-xl w-fit mb-4 ${accent} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${accent.replace("bg-", "text-")}`} />
      </div>
      <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-1">
        {title}
      </p>
      <p className="text-3xl font-black text-[#23251d]">
        {value ?? <span className="text-[#b6b7af]">—</span>}
      </p>
    </div>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-[#9ea096]">
      <AlertCircle className="w-8 h-8 opacity-40" />
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="py-16 flex justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-[#b6b7af]" />
    </div>
  );
}



// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewPanel() {
  const { data: dashData, loading: dashLoading } = useApi<DashboardStats>(API.dashboard);
  const [exporting, setExporting] = useState(false);
  const [projectionDays, setProjectionDays] = useState(0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(API.schools.export);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schools-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const { data: districtRaw, loading: distLoading } = useApi<PaginatedResponse<DistrictReport>>(
    `${API.predictions.district}?ordering=-week_start_date&page_size=1&projection_days=${projectionDays}`
  );
  const { data: predsRaw, loading: predsLoading } = useApi<PaginatedResponse<PredictionReport>>(
    `${API.predictions.list}?ordering=priority_rank&page_size=10&projection_days=${projectionDays}`
  );

  const district = districtRaw?.results?.[0] ?? null;
  const predictions = predsRaw?.results ?? [];
  const stats = dashData?.stats;

  const riskData = district
    ? [
        { name: "High Risk", value: district.high_risk_schools, color: "#ef4444" },
        { name: "Medium", value: district.medium_risk_schools, color: "#f59e0b" },
        { name: "Low Risk", value: district.low_risk_schools, color: "#10b981" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Schools"
          value={stats?.total_schools}
          icon={School}
          accent="bg-blue-600"
        />
        <KpiCard
          title="Active Contracts"
          value={stats?.active_contracts}
          icon={Briefcase}
          accent="bg-[#F54E00]"
        />
        <KpiCard
          title="Pending Bids"
          value={stats?.pending_bids}
          icon={ShieldAlert}
          accent="bg-amber-600"
        />
        <KpiCard
          title="District Avg Score"
          value={district ? `${Math.round(district.avg_score)}%` : null}
          icon={Activity}
          accent="bg-emerald-600"
        />
      </div>

      {/* Charts + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Risk Donut */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-lg font-black text-[#23251d]">
              Risk Distribution
            </h2>
            
            {/* Projection Toggle */}
            <div className="flex items-center gap-1 bg-[#d8d9d1] p-1 rounded-xl w-fit border border-[#b6b7af]/30">
              {[
                { label: "Current", value: 0 },
                { label: "+30 Days", value: 30 },
                { label: "+60 Days", value: 60 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setProjectionDays(opt.value)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    projectionDays === opt.value
                      ? "bg-white text-[#23251d] shadow-sm"
                      : "text-[#4d4f46] hover:text-[#23251d] hover:bg-white/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {distLoading ? (
            <Spinner />
          ) : riskData.length === 0 ? (
            <SectionEmpty message="No district prediction data yet." />
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {riskData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #b6b7af",
                        background: "#eeefe9",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {riskData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: r.color }}
                      />
                      <span className="text-sm font-semibold text-[#4d4f46]">
                        {r.name}
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#23251d]">
                      {r.value} schools
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Priority Schools Table */}
        <div className="lg:col-span-2 bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-[#b6b7af]/50 bg-white/30 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#23251d]">
              High Priority Schools
            </h2>
            <span className="text-xs font-bold text-[#9ea096] uppercase tracking-widest">
              Sorted by risk rank
            </span>
          </div>
          {predsLoading ? (
            <Spinner />
          ) : predictions.length === 0 ? (
            <SectionEmpty message="No prediction reports available yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-[#9ea096] border-b border-[#b6b7af]/40 bg-white/10">
                    <th className="px-6 py-4">School</th>
                    <th className="px-6 py-4">Risk Level</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b6b7af]/20">
                  {predictions.map((p, i) => (
                    <tr
                      key={p.id}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#23251d] text-sm">
                          {p.school_name ?? `School #${p.school}`}
                        </p>
                        <p className="text-[10px] text-[#9ea096] uppercase font-bold">
                          {new Date(p.generated_at).toLocaleDateString("en-IN")}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${getRiskColors(
                            p.overall_risk_level
                          )}`}
                        >
                          {p.overall_risk_level ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-white rounded-full overflow-hidden border border-[#b6b7af]/30">
                            <div
                              className={`h-full transition-all ${
                                p.overall_score < 40
                                  ? "bg-red-500"
                                  : p.overall_score < 70
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(p.overall_score, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-[#23251d]">
                            {Math.round(p.overall_score)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-[#4d4f46]">
                          #{p.priority_rank}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Export Button */}
      {!dashLoading && stats && (
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 bg-[#eeefe9] border border-[#b6b7af] text-[#23251d] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#23251d] hover:text-white transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          {exporting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exporting ? "Exporting…" : "Export Schools CSV"}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeoDashboard() {
  const isMounted = useIsMounted();
  const { user } = useAuthStore();

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-1">
          District <span className="text-[#F54E00]">Console</span>
        </h1>
        <p className="text-[#4d4f46]">
          Welcome, <span className="font-bold">{user?.email ?? "Officer"}</span>. Manage your district schools, staff, and infrastructure analytics.
        </p>
      </div>

      {/* Main Content */}
      <OverviewPanel />
    </div>
  );
}
