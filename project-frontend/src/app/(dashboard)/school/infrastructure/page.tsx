"use client";

import { useState } from "react";
import { 
  Building2, 
  Droplets, 
  Zap, 
  Trash2, 
  ShieldAlert,
  Save,
  CheckCircle2
} from "lucide-react";

export default function InfrastructureSurvey() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Groups
  const CardHeader = ({ icon: Icon, title, desc }: any) => (
    <div className="flex gap-4 mb-6">
      <div className="bg-[#F54E00] bg-opacity-10 p-3 rounded-xl text-[#F54E00]">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-xl font-black text-[#23251d]">{title}</h3>
        <p className="text-sm text-[#4d4f46]">{desc}</p>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // In real app, we extract form values here
    setTimeout(() => {
        setIsLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-4">
          Infrastructure <span className="text-[#F54E00]">Survey</span>
        </h1>
        <p className="text-[#4d4f46] max-w-2xl mx-auto">
          Update your school's structural and utility status. This data is used to prioritize maintenance and safety audits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Utilities */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
          <CardHeader 
            icon={Droplets} 
            title="Water & Sanitation" 
            desc="Status of toilets and water supply systems."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#23251d]">Boys Toilets (Total / Functional)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Total" className="flex-1 h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]" />
                <input type="number" placeholder="Functional" className="flex-1 h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#23251d]">Girls Toilets (Total / Functional)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Total" className="flex-1 h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]" />
                <input type="number" placeholder="Functional" className="flex-1 h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#b6b7af]">
              <span className="font-bold text-[#23251d]">Drinking Water Available?</span>
              <input type="checkbox" className="w-5 h-5 accent-[#F54E00]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#b6b7af]">
              <span className="font-bold text-[#23251d]">Water Quality OK?</span>
              <input type="checkbox" className="w-5 h-5 accent-[#F54E00]" />
            </div>
          </div>
        </div>

        {/* Electrical */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
          <CardHeader 
            icon={Zap} 
            title="Electrical Systems" 
            desc="Condition of power lines, fans, and lighting."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#23251d]">Wiring Condition</label>
              <select className="w-full h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]">
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="NON_FUNCTIONAL">Non-Functional</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#23251d]">Lighting Condition</label>
              <select className="w-full h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]">
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#b6b7af]">
              <span className="font-bold text-[#23251d]">Electricity Connection?</span>
              <input type="checkbox" className="w-5 h-5 accent-[#F54E00]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#b6b7af]">
              <span className="font-bold text-[#23251d]">Power Backup Available?</span>
              <input type="checkbox" className="w-5 h-5 accent-[#F54E00]" />
            </div>
          </div>
        </div>

        {/* Structural */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
          <CardHeader 
            icon={Building2} 
            title="Structural Condition" 
            desc="Physical state of classrooms and roof."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-[#23251d]">Overall Building Status</label>
              <select className="w-full h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]">
                <option value="GOOD">Good / Stable</option>
                <option value="NEEDS_MINOR_REPAIR">Needs Minor Repair</option>
                <option value="NEEDS_MAJOR_REPAIR">Needs Major Repair</option>
                <option value="CRITICAL">Critical Structural Risk</option>
              </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-[#23251d]">Max Crack Width (mm)</label>
                <input type="number" step="0.1" placeholder="0.0" className="w-full h-12 bg-white border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#b6b7af]">
              <span className="font-bold text-[#23251d]">Visible Wall Cracks?</span>
              <input type="checkbox" className="w-5 h-5 accent-[#F54E00]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#b6b7af]">
              <span className="font-bold text-[#23251d]">Roof Leakage Present?</span>
              <input type="checkbox" className="w-5 h-5 accent-[#F54E00]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#b6b7af]">
              <span className="font-bold text-[#23251d]">Drainage Issues?</span>
              <input type="checkbox" className="w-5 h-5 accent-[#F54E00]" />
            </div>
          </div>
        </div>

        {/* Cleanliness */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-8 shadow-sm">
          <CardHeader 
            icon={Trash2} 
            title="Sanitation & Maintenance" 
            desc="General cleanliness of the premises."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-[#23251d]">Toilet Cleanliness (1-5)</label>
              <input type="range" min="1" max="5" defaultValue="3" className="w-full accent-[#F54E00]" />
              <div className="flex justify-between text-xs font-bold text-[#9ea096]">
                <span>POOR</span>
                <span>EXCELLENT</span>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-[#23251d]">Campus Cleanliness (1-5)</label>
              <input type="range" min="1" max="5" defaultValue="3" className="w-full accent-[#F54E00]" />
              <div className="flex justify-between text-xs font-bold text-[#9ea096]">
                <span>POOR</span>
                <span>EXCELLENT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between bg-[#23251d] p-6 rounded-2xl shadow-xl">
          <div className="hidden md:flex items-center gap-3 text-white/70">
            <ShieldAlert className="w-5 h-5 text-[#F54E00]" />
            <p className="text-xs font-semibold">Data entered here is final and will trigger automated risk scoring.</p>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className={`flex items-center gap-2 px-10 h-14 rounded-xl font-black text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg
              ${success ? "bg-green-600" : "bg-[#F54E00] shadow-[#F54E00]/20"}
              disabled:opacity-70 disabled:pointer-events-none`}
           >
            {isLoading ? (
                "Processing..."
            ) : success ? (
              <><CheckCircle2 className="w-5 h-5" /> Survey Saved</>
            ) : (
              <><Save className="w-5 h-5" /> Submit Survey Data</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
