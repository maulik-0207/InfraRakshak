"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Droplets,
  Zap,
  Building,
  TrendingUp,
  ChevronRight,
  Shield,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { API } from "@/services/api";

interface PredictionReport {
  id: number;
  school: number;
  school_name?: string;
  weekly_report: number;
  overall_risk_level: string;
  overall_score: number;
  plumbing_risk_level: string;
  plumbing_score: number;
  electrical_risk_level: string;
  electrical_score: number;
  structural_risk_level: string;
  structural_score: number;
  priority_rank: number;
  model_version: string;
  generated_at: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

function riskColor(risk: string) {
  switch (risk?.toUpperCase()) {
    case "HIGH":
      return { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700 border-red-200" };
    case "MEDIUM":
      return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700 border-amber-200" };
    default:
      return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
}

function ScoreGauge({ score, label, icon: Icon, risk }: { score: number; label: string; icon: any; risk: string }) {
  const colors = riskColor(risk);
  const percentage = Math.min(100, Math.max(0, score));

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6 group hover:shadow-md transition-all`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text} border ${colors.border}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest">{label}</p>
          <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase ${colors.badge}`}>
            {risk}
          </span>
        </div>
      </div>
      <div className="mb-2">
        <span className="text-3xl font-black text-[#23251d]">{score.toFixed(1)}</span>
        <span className="text-sm font-bold text-[#9ea096]">%</span>
      </div>
      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            risk === "HIGH" ? "bg-red-500" : risk === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function PredictionResultsPage() {
  const isMounted = useIsMounted();
  const { data: predictionsRaw, loading } = useApi<PaginatedResponse<PredictionReport>>(
    `${API.predictions.list}?ordering=-created_at&page_size=20`
  );

  if (!isMounted) return <div className="min-h-screen" />;

  const predictions = predictionsRaw?.results ?? [];
  const latest = predictions.length > 0 ? predictions[0] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
          Prediction <span className="text-[#F54E00]">Results</span>
        </h1>
        <p className="text-[#4d4f46]">
          View ML-generated risk assessments for your school&apos;s infrastructure.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#b6b7af]" />
        </div>
      ) : !latest ? (
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl p-12 flex flex-col items-center gap-4 text-[#9ea096]">
          <BarChart3 className="w-12 h-12 opacity-30" />
          <p className="text-sm font-semibold text-center">
            No prediction results available yet. Results are generated every Monday at 6:30 PM after reports are submitted.
          </p>
        </div>
      ) : (
        <>
          {/* Overall Risk Hero */}
          <div className="bg-[#23251d] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F54E00] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="text-[#F54E00] font-black uppercase tracking-widest text-[10px] mb-2">
                    Latest Analysis
                  </p>
                  <h2 className="text-2xl font-black tracking-tight mb-1">Overall Risk Assessment</h2>
                  <p className="text-white/50 text-sm">
                    Generated {new Date(latest.generated_at).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-black">{latest.overall_score.toFixed(1)}%</p>
                  <span className={`inline-block mt-2 text-[10px] font-black border px-3 py-1 rounded-lg uppercase tracking-widest ${riskColor(latest.overall_risk_level).badge}`}>
                    {latest.overall_risk_level} Risk
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ScoreGauge
              score={latest.plumbing_score}
              label="Plumbing"
              icon={Droplets}
              risk={latest.plumbing_risk_level}
            />
            <ScoreGauge
              score={latest.electrical_score}
              label="Electrical"
              icon={Zap}
              risk={latest.electrical_risk_level}
            />
            <ScoreGauge
              score={latest.structural_score}
              label="Structural"
              icon={Building}
              risk={latest.structural_risk_level}
            />
          </div>

          {/* Historical Predictions */}
          {predictions.length > 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-[#23251d]">Previous Reports</h2>
              <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-3xl overflow-hidden">
                <div className="divide-y divide-[#b6b7af]/30 bg-white/40">
                  {predictions.slice(1).map((p) => {
                    const colors = riskColor(p.overall_risk_level);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-5 hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#23251d]">
                              {new Date(p.generated_at).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </p>
                            <p className="text-[10px] font-bold text-[#9ea096] uppercase tracking-widest mt-0.5">
                              Score: {p.overall_score.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black border px-3 py-1 rounded uppercase ${colors.badge}`}>
                          {p.overall_risk_level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
