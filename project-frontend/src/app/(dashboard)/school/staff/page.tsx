"use client";

import { useEffect, useState } from "react";
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  Trash2, 
  Edit2,
  X,
  ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface StaffMember {
  id: number;
  full_name: string;
  email: string;
  phone_no: string;
  parent_school: number;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/accounts/profiles/staff/");
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/accounts/profiles/staff/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          phone_no: phone
        })
      });
      if (res.ok) {
        fetchStaff();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (err) {
      console.error("Error adding staff", err);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`/api/v1/accounts/profiles/staff/${id}/`, {
        method: "DELETE"
      });
      if (res.ok) fetchStaff();
    } catch (err) {
      console.error("Error deleting staff", err);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
  };

  const filteredStaff = staff.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-2">
            Staff <span className="text-[#F54E00]">Management</span>
          </h1>
          <p className="text-[#4d4f46]">
            Manage reporting staff accounts. Authorized staff can submit weekly infrastructure health reports.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#F54E00] text-white px-6 py-3 rounded-lg font-bold shadow-[0_4px_0_0_#b17816] hover:translate-y-[-2px] active:translate-y-[2px] transition-all"
        >
          <UserPlus className="w-5 h-5" /> Onboard Staff
        </button>
      </div>

      {/* Utilities */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea096] w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-xl pl-12 pr-4 outline-none focus:border-[#F54E00] transition-colors"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#b6b7af] bg-[#eeefe9]">
              <th className="p-4 pl-8 text-xs font-black uppercase tracking-widest text-[#9ea096]">Member</th>
              <th className="p-4 text-xs font-black uppercase tracking-widest text-[#9ea096]">Contact Info</th>
              <th className="p-4 text-xs font-black uppercase tracking-widest text-[#9ea096]">Status</th>
              <th className="p-4 pr-8 text-xs font-black uppercase tracking-widest text-[#9ea096] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b6b7af]/50">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-[#9ea096] font-bold">Loading staff directory...</td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-[#9ea096] font-bold">No staff members found matching your search.</td>
              </tr>
            ) : (
              filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-white/30 transition-colors group">
                  <td className="p-4 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-[#23251d] flex items-center justify-center text-white font-black text-sm">
                        {member.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-[#23251d]">{member.full_name}</p>
                        <p className="text-xs text-[#4d4f46]">ID: #{member.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-[#4d4f46]">
                        <Mail className="w-3.5 h-3.5 text-[#F54E00]" /> {member.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#4d4f46]">
                        <Phone className="w-3.5 h-3.5 text-[#F54E00]" /> {member.phone_no}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-black px-2 py-1 rounded-full border border-green-100">
                      <ShieldCheck className="w-3 h-3" /> ACTIVE
                    </span>
                  </td>
                  <td className="p-4 pr-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white rounded-lg text-[#4d4f46] hover:text-[#F54E00] transition-colors shadow-sm border border-transparent hover:border-[#b6b7af]">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-[#4d4f46] hover:text-red-600 transition-colors shadow-sm border border-transparent hover:border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#23251d]/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="bg-[#fdfdf8] w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#eeefe9] p-6 border-b border-[#b6b7af] flex justify-between items-center">
              <h2 className="text-xl font-black text-[#23251d]">Staff Onboarding</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors"
               >
                <X className="w-5 h-5 text-[#4d4f46]" />
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#23251d]">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name" 
                  className="w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#23251d]">Official Email</label>
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@school.com" 
                  className="w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#23251d]">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000" 
                  className="w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-lg px-4 outline-none focus:border-[#F54E00] transition-colors"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-12 border-2 border-[#b6b7af] rounded-lg font-bold text-[#4d4f46] hover:bg-[#eeefe9] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-12 bg-[#F54E00] text-white rounded-lg font-bold shadow-[0_4px_0_0_#b17816] hover:translate-y-[-2px] active:translate-y-[2px] transition-all"
                >
                  Confirm Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
