"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Building, 
  FileBadge, 
  Phone, 
  Mail, 
  Save, 
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";
import toast from "react-hot-toast";

interface ContractorProfile {
  id: number;
  email: string;
  company_name: string;
  license_number: string;
  phone_no: string;
  created_at: string;
  updated_at: string;
}

export default function ContractorAccountPage() {
  const { data: profile, loading, refetch } = useApi<ContractorProfile>(API.profiles.contractors.me);
  const [formData, setFormData] = useState({
    company_name: "",
    license_number: "",
    phone_no: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state with fetched data
  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name,
        license_number: profile.license_number,
        phone_no: profile.phone_no
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(API.profiles.contractors.me, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Update failed");
      
      toast.success("Profile updated successfully!");
      refetch();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCcw className="w-8 h-8 text-[#F54E00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
          Account <span className="text-[#F54E00]">Settings</span>
        </h1>
        <p className="text-[#4d4f46] font-medium">Manage your verified contractor credentials and contact information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#23251d] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className="w-24 h-24" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 bg-[#F54E00] rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black truncate">{profile?.company_name}</h3>
                <p className="text-[#9ea096] text-sm font-bold flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {profile?.email}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 flex items-center gap-1.2">
                    <CheckCircle2 className="w-3 h-3" /> Verified Contractor
                 </span>
              </div>
            </div>
          </div>

          <div className="bg-[#eeefe9] border border-[#b6b7af] p-6 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest">Profile Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#9ea096] font-bold">Member Since</span>
                <span className="text-[#23251d] font-black">
                    {profile?.created_at ? new Date(profile.created_at).getFullYear() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9ea096] font-bold">Profile Health</span>
                <span className="text-green-600 font-black">Optimal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white border border-[#b6b7af] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-[#b6b7af]/40 bg-[#f8f9f4]">
              <h3 className="text-lg font-black text-[#23251d]">Contractor Credentials</h3>
              <p className="text-xs text-[#9ea096] font-bold mt-1 uppercase tracking-wider">Updates will take effect across the portal immediately.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-[#F54E00]" /> Company Name
                  </label>
                  <input 
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="w-full h-12 bg-[#eeefe9]/50 border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                    <FileBadge className="w-3 h-3 text-[#F54E00]" /> License Number
                  </label>
                  <input 
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                    className="w-full h-12 bg-[#eeefe9]/50 border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-[#F54E00]" /> Contact Phone
                </label>
                <input 
                  type="text"
                  value={formData.phone_no}
                  onChange={(e) => setFormData({...formData, phone_no: e.target.value})}
                  className="w-full h-12 bg-[#eeefe9]/50 border border-[#b6b7af] rounded-xl px-4 font-bold text-[#23251d] focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
                />
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="text-[10px] font-black text-[#4d4f46] uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Registered Email
                </label>
                <input 
                  type="email"
                  value={profile?.email}
                  disabled
                  className="w-full h-12 bg-gray-100 border border-[#b6b7af] rounded-xl px-4 font-bold text-[#9ea096] cursor-not-allowed"
                />
                <p className="text-[10px] text-[#9ea096] italic">Email address cannot be changed after verification.</p>
              </div>

              <div className="pt-8 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-4 bg-[#23251d] text-white rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#F54E00] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 flex items-start gap-3 p-6 bg-amber-50 rounded-2xl border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              <strong>Important Notice:</strong> Changing your company name or license number may trigger a re-verification process by the District Education Office. Please ensure all details match your official documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
