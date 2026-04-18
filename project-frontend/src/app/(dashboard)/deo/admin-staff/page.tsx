"use client";

import { useEffect, useState } from "react";
import { UserPlus, Search, Mail, Phone, Shield, ShieldAlert, MoreVertical, Loader2, Calendar } from "lucide-react";

interface AdminStaff {
  id: number;
  full_name: string;
  email: string;
  phone_no: string;
  user: number;
  created_at: string;
}

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<AdminStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: "", email: "", phone_no: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/accounts/profiles/admin-staff/");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch admin staff", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/accounts/profiles/admin-staff/onboard/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff)
      });
      if (res.ok) {
        setNewStaff({ full_name: "", email: "", phone_no: "" });
        setShowAddForm(false);
        fetchStaff();
      } else {
        alert("Failed to onboard staff. Please check inputs.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#23251d] tracking-tight">
              Admin <span className="text-[#F54E00]">Staff</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">Manage your district administrative team and permissions.</p>
          </div>
          <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className="h-14 px-8 bg-[#23251d] text-white font-black rounded-2xl shadow-xl transition-all hover:bg-[#F54E00] active:scale-95 flex items-center gap-2"
          >
            <UserPlus size={22} />
            {showAddForm ? "Cancel" : "Onboard Personnel"}
          </button>
        </div>

        {/* Add Staff Form */}
        {showAddForm && (
          <form onSubmit={handleAddStaff} className="bg-white rounded-[2rem] border border-[#F54E00] shadow-[0_8px_30px_rgb(245,78,0,0.1)] p-8 animate-in slide-in-from-top-4">
            <h3 className="text-lg font-black text-[#23251d] mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#F54E00]" /> Grant Administrative Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-black uppercase text-[#9ea096] mb-2 tracking-widest">Full Name</label>
                <input required type="text" value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})} className="w-full h-12 bg-[#eeefe9] border-transparent focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] rounded-xl px-4 text-sm font-semibold transition-all" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-[#9ea096] mb-2 tracking-widest">Email Address</label>
                <input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full h-12 bg-[#eeefe9] border-transparent focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] rounded-xl px-4 text-sm font-semibold transition-all" placeholder="john@edugov.in" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-[#9ea096] mb-2 tracking-widest">Phone Number (Optional)</label>
                <input type="text" value={newStaff.phone_no} onChange={e => setNewStaff({...newStaff, phone_no: e.target.value})} className="w-full h-12 bg-[#eeefe9] border-transparent focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] rounded-xl px-4 text-sm font-semibold transition-all" placeholder="+91 9876543210" />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button disabled={isSubmitting} type="submit" className="h-12 bg-[#F54E00] text-white px-8 rounded-xl font-black flex items-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-[#F54E00]/20 transition-all">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create & Send Credentials
              </button>
            </div>
          </form>
        )}

        {/* Main Content Area */}
        <div className="bg-[#eeefe9] rounded-[2.5rem] border border-[#b6b7af] shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="p-8 border-b border-[#b6b7af] flex flex-col md:flex-row gap-6 items-center justify-between bg-white/30">
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea096]" size={18} />
              <input 
                type="text" 
                placeholder="Search staff members by name or email..." 
                className="w-full pl-12 pr-4 h-12 bg-white border border-[#b6b7af] rounded-2xl focus:border-[#F54E00] outline-none transition-all font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 text-xs font-black text-[#9ea096] uppercase tracking-widest bg-[#23251d] text-white px-4 py-2 rounded-lg">
               Active Directory
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/10 uppercase text-[10px] font-black tracking-[0.2em] text-[#9ea096]">
                  <th className="p-6">Staff Member</th>
                  <th className="p-6">Contact Information</th>
                  <th className="p-6">Registry Date</th>
                  <th className="p-6 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 text-[#F54E00] animate-spin mx-auto" /><p className="mt-4 font-black text-[#9ea096] uppercase tracking-widest">Verifying credentials...</p></td></tr>
                ) : filteredStaff.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center font-bold text-[#9ea096]">No administrative personnel records found.</td></tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-white transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-[#23251d] flex items-center justify-center font-black text-white text-xl shadow-lg ring-4 ring-[#eeefe9]">
                            {staff.full_name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[#23251d] leading-tight group-hover:text-[#F54E00] transition-colors">{staff.full_name}</span>
                            <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.1em] mt-0.5">UID: STF-{staff.id.toString().padStart(4, '0')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#4d4f46]">
                            <Mail size={14} className="text-[#F54E00]" />
                            {staff.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#4d4f46]">
                            <Phone size={14} className="text-[#F54E00]" />
                            {staff.phone_no}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#4d4f46]">
                           <Calendar size={14} className="text-[#9ea096]" />
                           {new Date(staff.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button className="p-2 hover:bg-[#eeefe9] rounded-xl transition-all text-[#9ea096] hover:text-[#23251d]">
                          <MoreVertical size={22} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-[#23251d] text-white/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Shield size={20} className="text-[#F54E00]" />
               <p className="text-xs font-black uppercase tracking-[0.1em]">District Administrative Registry System — Authorized Access Only</p>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">{filteredStaff.length} Records Loaded</p>
          </div>
        </div>
      </div>
    </div>
  );
}
