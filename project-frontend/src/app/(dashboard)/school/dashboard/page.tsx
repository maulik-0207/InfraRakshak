"use client";

import { useState, useRef } from "react";
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  Trash2,
  Upload,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  role: string;
  email: string;
  stats: {
    total_staff?: number;
    pending_reports?: number;
    submitted_reports?: number;
  };
}

interface WeeklyReport {
  id: number;
  school: number;
  week_start_date: string;
  week_end_date: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

interface PredictionReport {
  id: number;
  school: number;
  overall_score: number;
  overall_risk_level: string;
  generated_at: string;
}

interface StaffProfile {
  id: number;
  user: number;
  email: string;
  full_name: string;
  phone_no: string;
  parent_school?: number;
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
  const map: Record<string, string> = {
    SUBMITTED: "text-blue-700 bg-blue-50 border-blue-200",
    REVIEWED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    DRAFT: "text-amber-700 bg-amber-50 border-amber-200",
  };
  return map[status?.toUpperCase()] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

function riskBadge(level: string) {
  const map: Record<string, string> = {
    HIGH: "text-red-700 bg-red-50 border-red-200",
    CRITICAL: "text-red-700 bg-red-50 border-red-200",
    MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
    LOW: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
  return map[level?.toUpperCase()] ?? "text-slate-600 bg-slate-50 border-slate-200";
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
    <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${accent}`} />
      <div className={`p-3 rounded-xl w-fit mb-4 ${accent} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${accent.replace("bg-", "text-")}`} />
      </div>
      <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-[#23251d]">
        {value ?? <span className="text-[#b6b7af]">—</span>}
      </p>
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

function Empty({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center gap-3 text-[#9ea096]">
      <AlertCircle className="w-8 h-8 opacity-40" />
      <p className="text-sm font-semibold text-center max-w-xs">{message}</p>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewPanel() {
  const { data: dashData, loading: dashLoading } = useApi<DashboardStats>(API.dashboard);
  const { data: reportsRaw, loading: reportsLoading } = useApi<PaginatedResponse<WeeklyReport>>(
    `${API.reports.list}?ordering=-week_start_date&page_size=5`
  );
  const { data: predsRaw, loading: predsLoading } = useApi<PredictionReport[] | PaginatedResponse<PredictionReport>>(
    `${API.predictions.list}?ordering=-generated_at&page_size=1`
  );

  const stats = dashData?.stats;
  const reports = reportsRaw?.results ?? [];
  const latestPred = Array.isArray(predsRaw)
    ? predsRaw[0]
    : predsRaw?.results?.[0] ?? null;

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Total Staff" value={stats?.total_staff} icon={Users} accent="bg-blue-600" />
        <KpiCard title="Reports Submitted" value={stats?.submitted_reports} icon={ClipboardCheck} accent="bg-[#F54E00]" />
        <KpiCard title="Pending Reports" value={stats?.pending_reports} icon={AlertTriangle} accent="bg-amber-600" />
        <KpiCard
          title="Risk Level"
          value={latestPred?.overall_risk_level ?? null}
          icon={Activity}
          accent="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reports */}
        <div className="lg:col-span-2 bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-[#b6b7af]/50 bg-white/30">
            <h2 className="text-lg font-black text-[#23251d]">Recent Weekly Reports</h2>
          </div>
          {reportsLoading ? (
            <Spinner />
          ) : reports.length === 0 ? (
            <Empty message="No weekly reports have been submitted yet." />
          ) : (
            <div className="divide-y divide-[#b6b7af]/30">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-8 py-4 hover:bg-white/40 transition-colors group cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-[#23251d] text-sm">
                      Week of {new Date(r.week_start_date).toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-[10px] text-[#9ea096] font-bold uppercase mt-0.5">
                      {r.submitted_at
                        ? `Submitted ${new Date(r.submitted_at).toLocaleDateString("en-IN")}`
                        : "Not submitted"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black border px-2.5 py-1 rounded-lg uppercase ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#9ea096] group-hover:text-[#F54E00] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Prediction Card */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm flex flex-col">
          <h2 className="text-lg font-black text-[#23251d] mb-6">Latest ML Prediction</h2>
          {predsLoading ? (
            <Spinner />
          ) : !latestPred ? (
            <Empty message="No ML predictions generated yet. Submit a weekly report first." />
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white/60 border border-[#b6b7af]/40 rounded-xl p-5">
                <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-2">Overall Score</p>
                <p className="text-4xl font-black text-[#23251d]">{Math.round(latestPred.overall_score)}</p>
                <div className="mt-3 h-2 bg-white rounded-full overflow-hidden border border-[#b6b7af]/30">
                  <div
                    className={`h-full transition-all ${
                      latestPred.overall_score < 40 ? "bg-red-500"
                      : latestPred.overall_score < 70 ? "bg-amber-500"
                      : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(latestPred.overall_score, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-1">Risk Level</p>
                  <span className={`text-xs font-black border px-3 py-1.5 rounded-lg uppercase ${riskBadge(latestPred.overall_risk_level)}`}>
                    {latestPred.overall_risk_level}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-1">Generated</p>
                  <p className="text-sm font-bold text-[#4d4f46]">
                    {new Date(latestPred.generated_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Staff Management Tab ─────────────────────────────────────────────────────

function StaffPanel() {
  const { data: staffRaw, loading, refetch } = useApi<PaginatedResponse<StaffProfile>>(
    API.profiles.staff
  );

  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const staffList = staffRaw?.results ?? [];

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this staff member? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API.profiles.staff}${id}/`, { method: "DELETE" });
      if (res.ok) {
        showMessage("Staff member removed successfully.", "success");
        refetch();
      } else {
        showMessage("Failed to remove. Try again.", "error");
      }
    } catch {
      showMessage("Network error.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", "STAFF");

    try {
      const res = await fetch(API.onboard.bulk, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message ?? "Staff onboarded successfully!", "success");
        refetch();
      } else {
        showMessage(data.error ?? data.detail ?? "Upload failed.", "error");
      }
    } catch {
      showMessage("Upload failed. Check your connection.", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#23251d]">School Staff</h2>
          <p className="text-sm text-[#4d4f46]">
            Manage inspection staff assigned to your school.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            id="staff-upload"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <label
            htmlFor="staff-upload"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all select-none
              ${uploading ? "bg-[#b6b7af] text-white cursor-not-allowed" : "bg-[#23251d] text-white hover:bg-[#F54E00]"}`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading…" : "Upload Excel"}
          </label>
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success"
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Upload note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong>Excel format required.</strong> Columns:{" "}
          <code className="bg-amber-100 px-1 rounded">email</code>,{" "}
          <code className="bg-amber-100 px-1 rounded">full_name</code>,{" "}
          <code className="bg-amber-100 px-1 rounded">phone_no</code>. Accounts are auto-created and passwords emailed.
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden">
        {loading ? (
          <Spinner />
        ) : staffList.length === 0 ? (
          <Empty message="No staff members added yet. Upload an Excel file to onboard your team." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-[#9ea096] border-b border-[#b6b7af] bg-white/20">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#23251d]">{s.full_name || "—"}</td>
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
                        {deleting === s.id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staffRaw && staffRaw.count > staffList.length && (
              <div className="px-6 py-3 text-xs text-[#9ea096] border-t border-[#b6b7af]/30 text-center">
                Showing {staffList.length} of {staffRaw.count} members
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "overview" | "staff";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "staff", label: "Staff Management" },
];

export default function SchoolDashboard() {
  const isMounted = useIsMounted();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-1">
          School <span className="text-[#F54E00]">Overview</span>
        </h1>
        <p className="text-[#4d4f46]">
          Welcome, <span className="font-bold">{user?.email ?? "Principal"}</span>. Track your school's infrastructure health and manage your reporting team.
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

      {activeTab === "overview" && <OverviewPanel />}
      {activeTab === "staff" && <StaffPanel />}
    </div>
  );
}
