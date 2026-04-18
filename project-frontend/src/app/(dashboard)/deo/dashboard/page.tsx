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

// ─── Admin Staff Management ───────────────────────────────────────────────────

function AdminStaffPanel() {
  const {
    data: staffData,
    loading,
    refetch,
  } = useApi<PaginatedResponse<AdminStaffProfile>>(API.profiles.adminStaff);

  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const staffList = staffData?.results ?? [];

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this admin staff member? This cannot be undone."))
      return;
    setDeleting(id);
    try {
      const res = await fetch(`${API.profiles.adminStaff}${id}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ text: "Staff member removed.", type: "success" });
        refetch();
      } else {
        setMessage({ text: "Failed to remove. Try again.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error.", type: "error" });
    } finally {
      setDeleting(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", "ADMIN_STAFF");

    try {
      const res = await fetch(API.onboard.bulk, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message ?? "Uploaded successfully!", type: "success" });
        refetch();
      } else {
        setMessage({
          text: data.error ?? data.detail ?? "Upload failed.",
          type: "error",
        });
      }
    } catch {
      setMessage({ text: "Upload failed. Check your connection.", type: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#23251d]">Admin Staff</h2>
          <p className="text-sm text-[#4d4f46]">
            Manage district-level admin staff members under your jurisdiction.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            id="admin-staff-upload"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <label
            htmlFor="admin-staff-upload"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all select-none
              ${uploading
                ? "bg-[#b6b7af] text-white cursor-not-allowed"
                : "bg-[#23251d] text-white hover:bg-[#F54E00]"
              }`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading…" : "Upload Excel"}
          </label>
        </div>
      </div>

      {/* Feedback banner */}
      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Upload instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong>Excel format required.</strong> Columns: <code className="bg-amber-100 px-1 rounded">email</code>,{" "}
          <code className="bg-amber-100 px-1 rounded">full_name</code>,{" "}
          <code className="bg-amber-100 px-1 rounded">phone_no</code>. Passwords are auto-generated and emailed.
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden">
        {loading ? (
          <Spinner />
        ) : staffList.length === 0 ? (
          <SectionEmpty message="No admin staff found. Upload an Excel file to onboard team members." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-[#9ea096] border-b border-[#b6b7af] bg-white/20">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-[#23251d]">
                      {s.full_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-[#4d4f46] text-sm">{s.email}</td>
                    <td className="px-6 py-4 text-[#4d4f46] text-sm">{s.phone_no || "—"}</td>
                    <td className="px-6 py-4 text-[#9ea096] text-xs">
                      {new Date(s.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="p-2 rounded-lg text-[#9ea096] hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                        title="Remove staff member"
                      >
                        {deleting === s.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staffData && staffData.count > staffList.length && (
              <div className="px-6 py-3 text-xs text-[#9ea096] border-t border-[#b6b7af]/30 text-center">
                Showing {staffList.length} of {staffData.count} members
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewPanel() {
  const { data: dashData, loading: dashLoading } = useApi<DashboardStats>(API.dashboard);
  const [exporting, setExporting] = useState(false);

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
    `${API.predictions.district}?ordering=-week_start_date&page_size=1`
  );
  const { data: predsRaw, loading: predsLoading } = useApi<PaginatedResponse<PredictionReport>>(
    `${API.predictions.list}?ordering=priority_rank&page_size=10`
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
          <h2 className="text-lg font-black text-[#23251d] mb-6">
            Risk Distribution
          </h2>
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

type Tab = "overview" | "admin-staff";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "admin-staff", label: "Admin Staff" },
];

export default function DeoDashboard() {
  const isMounted = useIsMounted();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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

      {/* Tabs */}
      <div className="flex gap-1 bg-[#eeefe9] border border-[#b6b7af] rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === t.id
                ? "bg-[#23251d] text-white shadow-sm"
                : "text-[#4d4f46] hover:text-[#23251d]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewPanel />}
      {activeTab === "admin-staff" && <AdminStaffPanel />}
    </div>
  );
}
