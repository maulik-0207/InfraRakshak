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
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { API } from "@/services/api";

type Tab = "plumbing" | "electrical" | "structural" | "summary";

export default function SchoolReportDetailPage({
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
  const [activeTab, setActiveTab] = useState<Tab>("plumbing");

  // Form States
  const [plumbing, setPlumbing] = useState<any>({});
  const [electrical, setElectrical] = useState<any>({});
  const [structural, setStructural] = useState<any>({});

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
        router.push("/school/dashboard");
      }
    } catch {
      router.push("/school/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, id]);


  if (!isMounted || loading) {
    return (
      <div className="py-20 flex justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#b6b7af]" />
      </div>
    );
  }

  const renderPlumbingForm = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Taps</label>
          <input disabled value={plumbing.total_taps ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Functional Taps</label>
          <input disabled value={plumbing.functional_taps ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50 focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Leakage Points</label>
          <input disabled value={plumbing.leakage_points_count ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Water Shortage Days</label>
          <input disabled value={plumbing.water_shortage_days ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#b6b7af]/30">
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={plumbing.drainage_blockage ?? false} className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00]" />
          <span className="text-sm font-bold text-[#23251d]">Drainage Blockage</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={plumbing.water_availability ?? true} className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00]" />
          <span className="text-sm font-bold text-[#23251d]">Water Available Today</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={plumbing.toilet_water_issue ?? false} className="w-5 h-5 rounded border-[#b6b7af] text-[#F54E00]" />
          <span className="text-sm font-bold text-[#23251d]">Toilet Water Issues</span>
        </label>
      </div>
    </div>
  );

  const renderElectricalForm = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Fans</label>
          <input disabled value={electrical.total_fans ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Functional Fans</label>
          <input disabled value={electrical.functional_fans ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Lights</label>
          <input disabled value={electrical.total_lights ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Functional Lights</label>
          <input disabled value={electrical.functional_lights ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Outage Hours (Total)</label>
          <input disabled value={electrical.power_outage_hours ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#b6b7af]/30">
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={electrical.backup_available ?? false} className="w-5 h-5 rounded border-[#b6b7af]" />
          <span className="text-sm font-bold text-[#23251d]">Backup Generator Available</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={electrical.wiring_issues ?? false} className="w-5 h-5 rounded border-[#b6b7af]" />
          <span className="text-sm font-bold text-[#23251d]">Wiring Issues Found</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={electrical.switchboard_issues ?? false} className="w-5 h-5 rounded border-[#b6b7af]" />
          <span className="text-sm font-bold text-[#23251d]">Broken Switchboards</span>
        </label>
      </div>
    </div>
  );

  const renderStructuralForm = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Total Classrooms</label>
          <input disabled value={structural.classrooms_total ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Usable Classrooms</label>
          <input disabled value={structural.classrooms_usable ?? ""} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#23251d] mb-1.5">Safety Rating</label>
          <select disabled value={structural.building_safety ?? "SAFE"} className="w-full h-11 bg-white border border-[#b6b7af] rounded-xl px-4 disabled:bg-gray-50">
            <option value="SAFE">Safe</option>
            <option value="MINOR_RISK">Minor Risk</option>
            <option value="UNSAFE">Unsafe / Critical</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-[#b6b7af]/30">
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={structural.roof_leakage ?? false} className="w-5 h-5 rounded border-[#b6b7af]" />
          <span className="text-sm font-bold text-[#23251d]">Roof Leakage</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={structural.wall_cracks ?? false} className="w-5 h-5 rounded border-[#b6b7af]" />
          <span className="text-sm font-bold text-[#23251d]">Wall Cracks</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={structural.plaster_damage ?? false} className="w-5 h-5 rounded border-[#b6b7af]" />
          <span className="text-sm font-bold text-[#23251d]">Plaster Damage</span>
        </label>
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" disabled checked={structural.repair_required ?? false} className="w-5 h-5 rounded border-[#b6b7af]" />
          <span className="text-sm font-bold text-[#23251d]">Immediate Repair Needed</span>
        </label>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-[#b6b7af] rounded-2xl p-8">
        <h3 className="text-xl font-black text-[#23251d] mb-4">Report Summary (Read-Only)</h3>

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
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/school/dashboard")}
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
        <h1 className="text-3xl font-black text-[#23251d] tracking-tight mb-1 flex items-center gap-3">
          <FileText className="w-7 h-7 text-[#F54E00]" /> Weekly Report
        </h1>
        <p className="text-[#4d4f46]">
          Submitted for Week of <span className="font-bold">{new Date(report.week_start_date).toLocaleDateString("en-IN")}</span>
        </p>
      </div>

      {/* Main Form Content */}
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-[#b6b7af] overflow-x-auto bg-white/30">
          {[
            { id: "plumbing", label: "Plumbing", icon: Droplets },
            { id: "electrical", label: "Electrical", icon: Zap },
            { id: "structural", label: "Structural", icon: Building },
            { id: "summary", label: "Overview", icon: CheckCircle2 },
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
