"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  Loader2,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";

interface AdminStaff {
  id: number;
  full_name: string;
  email: string;
  phone_no: string;
  user: number;
  parent_deo: number;
  created_at: string;
}
interface FormState {
  full_name: string;
  email: string;
  phone_no: string;
}

const EMPTY_FORM: FormState = { full_name: "", email: "", phone_no: "" };

export default function AdminStaffPage() {
  const { user, token } = useAuthStore();
  const [staffList, setStaffList] = useState<AdminStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };


  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/accounts/profiles/admin-staff/`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        const list: AdminStaff[] = data.results || data;
        setStaffList(list);
      }
    } catch (err) {
      console.error("Failed to fetch admin staff", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      console.log(">>> [DEBUG] Fetching DEO Profile ID");

      let finalDeoId = null;
      const deosRes = await fetch(`/api/v1/accounts/profiles/deos/`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (deosRes.ok) {
        const deosData = await deosRes.json();
        const profiles = deosData.results || deosData;
        const match = profiles.find((p: any) => p.email === user?.email);
        if (match) {
          finalDeoId = match.id;
          console.log(">>> [DEBUG] Found DEO Profile ID:", finalDeoId);
        } else {
          throw new Error("Could not find your DEO profile. Are you logged in as a DEO?");
        }
      } else {
        throw new Error("Failed to fetch DEO profiles to resolve ID.");
      }

      const res = await fetch(`/api/v1/accounts/profiles/admin-staff/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          parent_deo: finalDeoId,
          full_name: form.full_name,
          email: form.email,
          phone_no: form.phone_no,
        }),
      });

      // Always refresh the list — on 500 the record may still have been saved
      // (backend crashes on email send AFTER the DB write succeeds)
      await fetchStaff();

      if (res.ok) {
        showToast("Staff member added successfully!", "success");
        setShowModal(false);
        setForm(EMPTY_FORM);
      } else if (res.status === 500) {
        // Check if the new member appeared in the refreshed list
        showToast(
          "The server returned an error (likely email config). Check the list — the staff member may still have been added.",
          "error"
        );
        setShowModal(false);
        setForm(EMPTY_FORM);
      } else {
        const data = await res.clone().json().catch(() => ({}));
        const msg =
          data.error ?? data.detail ??
          data.full_name?.[0] ?? data.email?.[0] ??
          data.phone_no?.[0] ?? data.parent_deo?.[0] ??
          "Failed to add staff member.";
        showToast(msg, "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };


  const filteredStaff = staffList.filter(
    (s) =>
      (s.full_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fdfdf8] p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            {toast.text}
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#23251d] tracking-tight">
              Admin <span className="text-[#F54E00]">Staff</span>
            </h1>
            <p className="text-[#4d4f46] mt-2 font-medium">
              Manage your district administrative team and permissions.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">

            {/* Add Single Staff */}
            <button
              onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
              className="h-12 px-6 bg-[#23251d] text-white font-bold rounded-xl shadow-lg transition-all hover:bg-[#F54E00] active:scale-95 flex items-center gap-2 text-sm"
            >
              <UserPlus size={18} />
              Add Staff Member
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#eeefe9] rounded-[2.5rem] border border-[#b6b7af] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#b6b7af] flex flex-col md:flex-row gap-6 items-center justify-between bg-white/30">
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ea096]" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-12 pr-4 h-12 bg-white border border-[#b6b7af] rounded-2xl focus:border-[#F54E00] outline-none transition-all font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest bg-[#23251d] px-4 py-2 rounded-lg">
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
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b6b7af]/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <Loader2 className="w-10 h-10 text-[#F54E00] animate-spin mx-auto" />
                      <p className="mt-4 font-black text-[#9ea096] uppercase tracking-widest text-xs">
                        Verifying credentials...
                      </p>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center font-bold text-[#9ea096]">
                      No administrative personnel records found.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-white transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-2xl bg-[#23251d] flex items-center justify-center font-black text-white text-lg shadow-lg ring-4 ring-[#eeefe9]">
                            {(staff.full_name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[#23251d] leading-tight group-hover:text-[#F54E00] transition-colors">
                              {staff.full_name || "—"}
                            </span>
                            <span className="text-[10px] font-black text-[#9ea096] uppercase tracking-[0.1em] mt-0.5">
                              UID: STF-{staff.id.toString().padStart(4, "0")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#4d4f46]">
                            <Mail size={13} className="text-[#F54E00]" />
                            {staff.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#4d4f46]">
                            <Phone size={13} className="text-[#F54E00]" />
                            {staff.phone_no || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#4d4f46]">
                          <Calendar size={13} className="text-[#9ea096]" />
                          {new Date(staff.created_at).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button className="p-2 hover:bg-[#eeefe9] rounded-xl transition-all text-[#9ea096] hover:text-[#23251d]">
                          <MoreVertical size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-[#23251d] text-white/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield size={18} className="text-[#F54E00]" />
              <p className="text-[10px] font-black uppercase tracking-[0.1em]">
                District Administrative Registry — Authorized Access Only
              </p>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">
              {filteredStaff.length} Records Loaded
            </p>
          </div>
        </div>
      </div>

      {/* ── Add Staff Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-[#fdfdf8] rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#b6b7af] bg-[#eeefe9]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#23251d] rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#23251d]">Add Staff Member</h2>
                  <p className="text-xs text-[#9ea096] font-semibold">Password will be auto-generated & emailed</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-[#b6b7af]/30 text-[#9ea096] hover:text-[#23251d] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddStaff} className="px-8 py-6 space-y-5">


              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#23251d] uppercase tracking-widest">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ea096]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ravi Kumar Sharma"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full h-12 pl-11 pr-4 bg-[#eeefe9] border border-[#b6b7af] rounded-xl text-sm font-semibold text-[#23251d] placeholder:text-[#9ea096] focus:outline-none focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#23251d] uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ea096]" />
                  <input
                    type="email"
                    required
                    placeholder="staff@district.gov.in"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full h-12 pl-11 pr-4 bg-[#eeefe9] border border-[#b6b7af] rounded-xl text-sm font-semibold text-[#23251d] placeholder:text-[#9ea096] focus:outline-none focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#23251d] uppercase tracking-widest">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ea096]" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={form.phone_no}
                    onChange={(e) => setForm((f) => ({ ...f, phone_no: e.target.value }))}
                    className="w-full h-12 pl-11 pr-4 bg-[#eeefe9] border border-[#b6b7af] rounded-xl text-sm font-semibold text-[#23251d] placeholder:text-[#9ea096] focus:outline-none focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] transition-all"
                  />
                </div>
              </div>

              {/* Info note */}
              <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>A secure password will be auto-generated and sent to the staff member's email.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 rounded-xl border border-[#b6b7af] font-bold text-sm text-[#4d4f46] hover:bg-[#eeefe9] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-[#F54E00] text-white font-bold text-sm hover:bg-[#F54E00]/80 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
