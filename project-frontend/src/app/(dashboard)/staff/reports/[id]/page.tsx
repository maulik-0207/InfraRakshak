"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  RefreshCw,
  Droplets,
  Zap,
  Building,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { API } from "@/services/api";

type Tab = "plumbing" | "electrical" | "structural" | "summary";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isMounted = useIsMounted();
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("plumbing");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form States
  const [plumbing, setPlumbing] = useState<any>({});
  const [electrical, setElectrical] = useState<any>({});
  const [structural, setStructural] = useState<any>({});

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API.reports.list}${id}/`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setPlumbing(data.plumbing_report || {});
        setElectrical(data.electrical_report || {});
        setStructural(data.structural_report || {});
      } else {
        router.push("/staff/dashboard");
      }
    } catch {
      router.push("/staff/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, id]);

  const handleSaveSubReport = async (type: Tab) => {
    if (!report || report.status !== "DRAFT") return;
    setSaving(true);
    let url = "";
    let payload = {};

    if (type === "plumbing" && plumbing.id) {
      url = `${API.reports.plumbing}${plumbing.id}/`;
      payload = plumbing;
    } else if (type === "electrical" && electrical.id) {
      url = `${API.reports.electrical}${electrical.id}/`;
      payload = electrical;
    } else if (type === "structural" && structural.id) {
      url = `${API.reports.structural}${structural.id}/`;
      payload = structural;
    }

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showMessage("Saved successfully", "success");
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (type === "plumbing") setActiveTab("electrical");
        else if (type === "electrical") setActiveTab("structural");
        else if (type === "structural") setActiveTab("summary");
      } else {
        const err = await res.json();
        const msg = Object.values(err)[0] as string | string[];
        showMessage(Array.isArray(msg) ? msg[0] : (typeof msg === 'string' ? msg : "Failed to save"), "error");
      }
    } catch {
      showMessage("Network error during save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!confirm("Are you sure you want to lock and submit this report? You cannot edit it afterward.")) return;
    setSubmitting(true);
    try {
      const res = await fetch(API.reports.submit(id), { method: "POST" });
      if (res.ok) {
        setReport({ ...report, status: "SUBMITTED" });
        showMessage("Weekly Report Submitted Successfully!", "success");
        setTimeout(() => router.push("/staff/dashboard"), 2000);
      } else {
        showMessage("Submission failed. Ensure all data is valid.", "error");
      }
    } catch {
      showMessage("Network error during submission", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="py-20 flex justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#b6b7af]" />
      </div>
    );
  }

  const isReadOnly = report?.status !== "DRAFT";

  const renderPlumbingForm = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Taps</label>
          <input
            type="number"
            disabled={isReadOnly}
            value={plumbing.total_taps ?? ""}
            onChange={(e) => setPlumbing({ ...plumbing, total_taps: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Functional Taps</label>
          <input
            type="number"
            disabled={isReadOnly}
            value={plumbing.functional_taps ?? ""}
            onChange={(e) => setPlumbing({ ...plumbing, functional_taps: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Leakage Points</label>
          <input
            type="number"
            disabled={isReadOnly}
            value={plumbing.leakage_points_count ?? ""}
            onChange={(e) => setPlumbing({ ...plumbing, leakage_points_count: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Water Shortage Days</label>
          <input
            type="number"
            disabled={isReadOnly}
            value={plumbing.water_shortage_days ?? ""}
            onChange={(e) => setPlumbing({ ...plumbing, water_shortage_days: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#b6b7af]/30">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={isReadOnly}
            checked={plumbing.drainage_blockage ?? false}
            onChange={(e) => setPlumbing({ ...plumbing, drainage_blockage: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Drainage Blockage</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={isReadOnly}
            checked={plumbing.water_availability ?? true}
            onChange={(e) => setPlumbing({ ...plumbing, water_availability: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Water Available Today</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={isReadOnly}
            checked={plumbing.toilet_water_issue ?? false}
            onChange={(e) => setPlumbing({ ...plumbing, toilet_water_issue: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Toilet Water Issues</span>
        </label>
      </div>
      {!isReadOnly && (
        <div className="flex justify-end pt-6">
          <button
            onClick={() => handleSaveSubReport("plumbing")}
            disabled={saving}
            className="flex items-center gap-2 bg-[#23251d] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#F54E00] transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Continue
          </button>
        </div>
      )}
    </div>
  );

  const renderElectricalForm = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Fans</label>
          <input
            type="number" disabled={isReadOnly} value={electrical.total_fans ?? ""}
            onChange={(e) => setElectrical({ ...electrical, total_fans: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Functional Fans</label>
          <input
            type="number" disabled={isReadOnly} value={electrical.functional_fans ?? ""}
            onChange={(e) => setElectrical({ ...electrical, functional_fans: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Lights</label>
          <input
            type="number" disabled={isReadOnly} value={electrical.total_lights ?? ""}
            onChange={(e) => setElectrical({ ...electrical, total_lights: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Functional Lights</label>
          <input
            type="number" disabled={isReadOnly} value={electrical.functional_lights ?? ""}
            onChange={(e) => setElectrical({ ...electrical, functional_lights: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Outage Hours (Total)</label>
          <input
            type="number" step="0.5" disabled={isReadOnly} value={electrical.power_outage_hours ?? ""}
            onChange={(e) => setElectrical({ ...electrical, power_outage_hours: parseFloat(e.target.value) })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#b6b7af]/30">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" disabled={isReadOnly} checked={electrical.backup_available ?? false}
            onChange={(e) => setElectrical({ ...electrical, backup_available: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Backup Generator Available</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" disabled={isReadOnly} checked={electrical.wiring_issues ?? false}
            onChange={(e) => setElectrical({ ...electrical, wiring_issues: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Wiring Issues Found</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" disabled={isReadOnly} checked={electrical.switchboard_issues ?? false}
            onChange={(e) => setElectrical({ ...electrical, switchboard_issues: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Broken Switchboards</span>
        </label>
      </div>
      {!isReadOnly && (
        <div className="flex justify-end pt-6">
          <button
            onClick={() => handleSaveSubReport("electrical")}
            disabled={saving}
            className="flex items-center gap-2 bg-[#23251d] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#F54E00] transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Continue
          </button>
        </div>
      )}
    </div>
  );

  const renderStructuralForm = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Classrooms</label>
          <input
            type="number" disabled={isReadOnly} value={structural.classrooms_total ?? ""}
            onChange={(e) => setStructural({ ...structural, classrooms_total: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Usable Classrooms</label>
          <input
            type="number" disabled={isReadOnly} value={structural.classrooms_usable ?? ""}
            onChange={(e) => setStructural({ ...structural, classrooms_usable: +e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Safety Rating</label>
          <select
            disabled={isReadOnly} value={structural.building_safety ?? "SAFE"}
            onChange={(e) => setStructural({ ...structural, building_safety: e.target.value })}
            className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
          >
            <option value="SAFE">Safe</option>
            <option value="MINOR_RISK">Minor Risk</option>
            <option value="UNSAFE">Unsafe / Critical</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-[#b6b7af]/30">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" disabled={isReadOnly} checked={structural.roof_leakage ?? false}
            onChange={(e) => setStructural({ ...structural, roof_leakage: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Roof Leakage</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" disabled={isReadOnly} checked={structural.wall_cracks ?? false}
            onChange={(e) => setStructural({ ...structural, wall_cracks: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Wall Cracks</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" disabled={isReadOnly} checked={structural.plaster_damage ?? false}
            onChange={(e) => setStructural({ ...structural, plaster_damage: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Plaster Damage</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" disabled={isReadOnly} checked={structural.repair_required ?? false}
            onChange={(e) => setStructural({ ...structural, repair_required: e.target.checked })}
            className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00] focus:ring-[#F54E00]"
          />
          <span className="text-sm font-bold text-[#23251d]">Immediate Repair Needed</span>
        </label>
      </div>
      {!isReadOnly && (
        <div className="flex justify-end pt-6">
          <button
            onClick={() => handleSaveSubReport("structural")}
            disabled={saving}
            className="flex items-center gap-2 bg-[#23251d] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#F54E00] transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Continue
          </button>
        </div>
      )}
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-[#b6b7af] rounded-2xl p-8">
        <h3 className="text-xl font-black text-[#23251d] mb-4">Report Review</h3>
        <p className="text-sm text-[#4d4f46] mb-6">
          Please review the details in each tab. Once you are confident all metrics are accurate, lock and submit this weekly report.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#eeefe9] p-5 rounded-xl border border-[#b6b7af]/40">
            <p className="text-[10px] font-black uppercase text-[#9ea096] tracking-widest mb-2">Plumbing</p>
            <p className="text-sm font-bold text-[#23251d]">
              {plumbing.functional_taps} / {plumbing.total_taps} Taps Working
            </p>
            {plumbing.water_availability === false && (
              <p className="text-xs font-bold text-red-600 mt-1 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> No Water
              </p>
            )}
          </div>
          <div className="bg-[#eeefe9] p-5 rounded-xl border border-[#b6b7af]/40">
            <p className="text-[10px] font-black uppercase text-[#9ea096] tracking-widest mb-2">Electrical</p>
            <p className="text-sm font-bold text-[#23251d]">
              {electrical.functional_lights} Lights · {electrical.functional_fans} Fans
            </p>
            {electrical.wiring_issues && (
              <p className="text-xs font-bold text-amber-600 mt-1 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Wiring Risks
              </p>
            )}
          </div>
          <div className="bg-[#eeefe9] p-5 rounded-xl border border-[#b6b7af]/40">
            <p className="text-[10px] font-black uppercase text-[#9ea096] tracking-widest mb-2">Structural</p>
            <p className="text-sm font-bold text-[#23251d]">
              {structural.classrooms_usable} / {structural.classrooms_total} Usable Rooms
            </p>
            {structural.building_safety === "UNSAFE" && (
              <p className="text-xs font-bold text-red-600 mt-1 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Critical Safety
              </p>
            )}
          </div>
        </div>

        {!isReadOnly && (
          <div className="mt-8 pt-6 border-t border-[#b6b7af]/40 flex justify-end">
            <button
              onClick={handleSubmitFinal}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#F54E00] text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-[#F54E00]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Lock & Submit Weekly Report
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/staff/dashboard")}
          className="flex items-center gap-1.5 text-sm font-bold text-[#9ea096] hover:text-[#F54E00] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </button>
        <div
          className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
            report.status === "DRAFT"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200"
          }`}
        >
          {report.status}
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#23251d] tracking-tight mb-1">
          Weekly Report Details
        </h1>
        <p className="text-[#4d4f46]">
          Week of <span className="font-bold">{new Date(report.week_start_date).toLocaleDateString("en-IN")}</span>
        </p>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`px-5 py-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success"
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <AlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Main Form Content */}
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-[#b6b7af] overflow-x-auto bg-white/30">
          {[
            { id: "plumbing", label: "Plumbing", icon: Droplets },
            { id: "electrical", label: "Electrical", icon: Zap },
            { id: "structural", label: "Structural", icon: Building },
            { id: "summary", label: "Review & Submit", icon: CheckCircle2 },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${
                activeTab === t.id
                  ? "border-[#F54E00] text-[#F54E00] bg-white"
                  : "border-transparent text-[#9ea096] hover:text-[#4d4f46] hover:bg-white/50"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "plumbing" && renderPlumbingForm()}
          {activeTab === "electrical" && renderElectricalForm()}
          {activeTab === "structural" && renderStructuralForm()}
          {activeTab === "summary" && renderSummary()}
        </div>
      </div>
    </div>
  );
}
