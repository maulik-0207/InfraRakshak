"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  Building,
  Save,
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
  const [projectionDays, setProjectionDays] = useState(0);
  const { data: dashData, loading: dashLoading } = useApi<DashboardStats>(API.dashboard);
  const { data: reportsRaw, loading: reportsLoading } = useApi<PaginatedResponse<WeeklyReport>>(
    `${API.reports.list}?ordering=-week_start_date&page_size=5`
  );
  const { data: predsRaw, loading: predsLoading } = useApi<PredictionReport[] | PaginatedResponse<PredictionReport>>(
    `${API.predictions.list}?ordering=-generated_at&page_size=1&projection_days=${projectionDays}`
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
                <Link
                  href={`/school/reports/${r.id}`}
                  key={r.id}
                  className="flex items-center justify-between px-8 py-4 hover:bg-white/40 transition-colors group cursor-pointer block"
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
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Latest Prediction Card */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-lg font-black text-[#23251d]">Latest ML Prediction</h2>
            
            {/* Projection Toggle */}
            <div className="flex items-center gap-1 bg-[#d8d9d1] p-1 rounded-xl w-fit border border-[#b6b7af]/30">
              {[
                { label: "Today", value: 0 },
                { label: "30d", value: 30 },
                { label: "60d", value: 60 },
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      showMessage("Name and Email are required.", "error");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API.profiles.staff}onboard/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, phone_no: phone }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Staff onboarded! Credentials emailed successfully.", "success");
        setFullName("");
        setEmail("");
        setPhone("");
        refetch();
      } else {
        showMessage(data.error ?? data.detail ?? "Failed to onboard staff.", "error");
      }
    } catch {
      showMessage("Network error. Try again.", "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Head & Form */}
      <div>
        <h2 className="text-2xl font-black text-[#23251d] mb-1">School Staff</h2>
        <p className="text-sm text-[#4d4f46] mb-6">
          Add ground staff to manage infrastructure reporting. Passwords will be emailed automatically.
        </p>

        <form onSubmit={handleAddSubmit} className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-black uppercase text-[#9ea096] tracking-widest pl-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-black uppercase text-[#9ea096] tracking-widest pl-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
              placeholder="rahul@example.com"
            />
          </div>
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-black uppercase text-[#9ea096] tracking-widest pl-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
              placeholder="+91 9999999999"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="w-full md:w-auto h-11 px-6 bg-[#23251d] text-white rounded-xl font-bold hover:bg-[#F54E00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Staff
          </button>
        </form>
      </div>
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

// ─── Data Management Tab ──────────────────────────────────────────────────────

function DataPanel() {
  const { data: rawProfile, loading, refetch } = useApi<PaginatedResponse<any>>(
    API.schools.profiles
  );
  
  const existingProfile = rawProfile?.results?.[0] ?? null;

  const { data: schoolMeta } = useApi<any>(
    !existingProfile ? API.schools.me : null
  );

  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 1. Sync from existing profile (Main Source)
  useEffect(() => {
    if (existingProfile) {
      setProfile(existingProfile);
    }
  }, [existingProfile]);

  // 2. Fallback: Sync from school metadata if profile doesn't exist (Identity/Admin source)
  useEffect(() => {
    if (!existingProfile && schoolMeta) {
      setProfile((prev: any) => ({
        ...prev,
        ...schoolMeta,
        // Ensure academic year is defaulted
        academic_year: prev.academic_year || "2025-2026"
      }));
    }
  }, [existingProfile, schoolMeta]);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    const isUpdate = !!existingProfile;
    const url = isUpdate ? `${API.schools.profiles}${existingProfile.id}/` : API.schools.profiles;
    const method = isUpdate ? "PATCH" : "POST";

    // Set default academic year if not present
    const payload = { 
      ...profile, 
      academic_year: profile.academic_year || "2025-2026" 
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showMessage("Profile updated successfully!", "success");
        refetch();
      } else {
        const err = await res.json();
        const msg = Object.values(err)[0] as string | string[];
        showMessage(Array.isArray(msg) ? msg[0] : (typeof msg === 'string' ? msg : "Failed to save profile"), "error");
      }
    } catch {
      showMessage("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#23251d]">School Profile & Data</h2>
          <p className="text-sm text-[#4d4f46]">
            Manage your school's demographic and structural data. Accuracy is crucial for the ML analysis.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#F54E00] text-white px-6 py-2.5 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#F54E00]/20 disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {existingProfile ? "Save Changes" : "Initialize Profile"}
        </button>
      </div>

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

      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 space-y-10 shadow-sm">
        {/* School Identity & Admin */}
        <div>
          <h3 className="text-sm font-black text-[#23251d] mb-6 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-[#F54E00]" /> School Identity & Administrative
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Full School Name</label>
              <input
                type="text"
                value={profile.name ?? ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] font-bold"
                placeholder="e.g. Govt. Model Sr. Sec. School"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Government UDISE Code</label>
              <input
                type="text"
                value={profile.udise_code ?? ""}
                onChange={(e) => setProfile({ ...profile, udise_code: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] font-mono"
                placeholder="240XXXXXXXXXXXXXXXX"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">District</label>
              <input
                type="text"
                value={profile.district ?? ""}
                onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Block / Tehsil</label>
              <input
                type="text"
                value={profile.block ?? ""}
                onChange={(e) => setProfile({ ...profile, block: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Cluster</label>
              <input
                type="text"
                value={profile.cluster ?? ""}
                onChange={(e) => setProfile({ ...profile, cluster: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Pincode</label>
              <input
                type="text"
                value={profile.pincode ?? ""}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              />
            </div>
          </div>
        </div>

        {/* Location & Geographic */}
        <div className="pt-8 border-t border-[#b6b7af]/40">
          <h3 className="text-sm font-black text-[#23251d] mb-6 uppercase tracking-wider">Location & Geographic Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Full Physical Address</label>
              <textarea
                rows={4}
                value={profile.address ?? ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-white border border-[#b6b7af] rounded-xl p-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00]"
              />
            </div>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={profile.latitude ?? ""}
                  onChange={(e) => setProfile({ ...profile, latitude: e.target.value })}
                  className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-[#4d4f46] pl-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={profile.longitude ?? ""}
                  onChange={(e) => setProfile({ ...profile, longitude: e.target.value })}
                  className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Context */}
        <div className="pt-8 border-t border-[#b6b7af]/40">
          <h3 className="text-sm font-black text-[#23251d] mb-6 uppercase tracking-wider">Academic Lifecycle</h3>
          <div className="max-w-xs space-y-1.5">
            <label className="block text-[13px] font-black text-[#9ea096] uppercase tracking-widest pl-1">
              Active Academic Year
            </label>
            <input
              type="text"
              value={profile.academic_year || "2025-2026"}
              onChange={(e) => setProfile({ ...profile, academic_year: e.target.value })}
              className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] font-black tracking-widest"
              placeholder="e.g. 2025-2026"
            />
          </div>
        </div>

        {/* Demographics Block */}
        <div className="pt-6 border-t border-[#b6b7af]/40">
          <h3 className="text-sm font-black text-[#23251d] mb-4 uppercase tracking-wider">Student Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Total Enrolled Students</label>
              <input
                type="number"
                value={profile.total_students ?? ""}
                onChange={(e) => setProfile({ ...profile, total_students: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Total Boys</label>
              <input
                type="number"
                value={profile.total_boys ?? ""}
                onChange={(e) => setProfile({ ...profile, total_boys: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Total Girls</label>
              <input
                type="number"
                value={profile.total_girls ?? ""}
                onChange={(e) => setProfile({ ...profile, total_girls: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Staff & Rooms Block */}
        <div className="pt-6 border-t border-[#b6b7af]/40">
          <h3 className="text-sm font-black text-[#23251d] mb-4 uppercase tracking-wider">Staff & Infrastructure</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Teaching Staff</label>
              <input
                type="number"
                value={profile.teachers_count ?? ""}
                onChange={(e) => setProfile({ ...profile, teachers_count: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Non-Teaching Staff</label>
              <input
                type="number"
                value={profile.non_teaching_staff_count ?? ""}
                onChange={(e) => setProfile({ ...profile, non_teaching_staff_count: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Total Classrooms</label>
              <input
                type="number"
                value={profile.classrooms_count ?? ""}
                onChange={(e) => setProfile({ ...profile, classrooms_count: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Functional Rooms</label>
              <input
                type="number"
                value={profile.functional_classrooms ?? ""}
                onChange={(e) => setProfile({ ...profile, functional_classrooms: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00]"
              />
            </div>
          </div>
        </div>



        {/* Structural & ML Metadata */}
        <div className="pt-6 border-t border-[#b6b7af]/40">
          <h3 className="text-sm font-black text-[#23251d] mb-4 uppercase tracking-wider">Structural & ML Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">School Type</label>
              <select
                value={profile.school_type ?? "PRIMARY"}
                onChange={(e) => setProfile({ ...profile, school_type: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              >
                <option value="PRIMARY">Primary</option>
                <option value="SECONDARY">Secondary</option>
                <option value="HIGHER_SECONDARY">Higher Secondary</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Weather Zone</label>
              <select
                value={profile.weather_zone ?? "Dry"}
                onChange={(e) => setProfile({ ...profile, weather_zone: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              >
                <option value="Coastal">Coastal</option>
                <option value="Dry">Dry</option>
                <option value="Heavy Rain">Heavy Rain</option>
                <option value="Tribal">Tribal</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Material Type</label>
              <select
                value={profile.material_type ?? "RCC"}
                onChange={(e) => setProfile({ ...profile, material_type: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              >
                <option value="Brick">Brick</option>
                <option value="Mixed">Mixed</option>
                <option value="RCC">RCC</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Building Age (Years)</label>
              <input
                type="number"
                value={profile.building_age ?? 5}
                onChange={(e) => setProfile({ ...profile, building_age: +e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              />
            </div>
            <label className="flex items-center gap-3 pt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.is_girls_school ?? false}
                onChange={(e) => setProfile({ ...profile, is_girls_school: e.target.checked })}
                className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
              />
              <span className="text-sm font-bold text-[#23251d]">Girls School Only</span>
            </label>
            <label className="flex items-center gap-3 pt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.flood_prone_area ?? false}
                onChange={(e) => setProfile({ ...profile, flood_prone_area: e.target.checked })}
                className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
              />
              <span className="text-sm font-bold text-[#23251d]">Flood Prone Zone</span>
            </label>
          </div>
        </div>

        {/* Utilities & Services */}
        <div className="pt-6 border-t border-[#b6b7af]/40">
          <h3 className="text-sm font-black text-[#23251d] mb-4 uppercase tracking-wider">Utilities & Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-[13px] font-bold text-[#4d4f46] mb-1.5">Area Type</label>
              <select
                value={profile.area_type ?? "RURAL"}
                onChange={(e) => setProfile({ ...profile, area_type: e.target.value })}
                className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 focus:border-[#F54E00]"
              >
                <option value="RURAL">Rural</option>
                <option value="URBAN">Urban</option>
                <option value="SEMI_URBAN">Semi-Urban</option>
              </select>
            </div>
            <label className="flex items-center gap-3 pt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.electricity_available ?? false}
                onChange={(e) => setProfile({ ...profile, electricity_available: e.target.checked })}
                className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
              />
              <span className="text-sm font-bold text-[#23251d]">Grid Electricity</span>
            </label>
            <label className="flex items-center gap-3 pt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.drinking_water_available ?? false}
                onChange={(e) => setProfile({ ...profile, drinking_water_available: e.target.checked })}
                className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
              />
              <span className="text-sm font-bold text-[#23251d]">Drinking Water</span>
            </label>
            <label className="flex items-center gap-3 pt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.internet_available ?? false}
                onChange={(e) => setProfile({ ...profile, internet_available: e.target.checked })}
                className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
              />
              <span className="text-sm font-bold text-[#23251d]">Internet Ready</span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "overview" | "staff" | "data";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "staff", label: "Staff Management" },
  { id: "data", label: "School Profile" },
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
      {activeTab === "data" && <DataPanel />}
    </div>
  );
}
