"use client";

import { useAuthStore } from "@/store/auth-store";
import { User, Mail, Shield, Building, Key, Bell, CreditCard, LogOut } from "lucide-react";
import { useState } from "react";

export default function AccountPage() {
  const { user, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Key },
    { id: "notifications", label: "Alerts", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight">
            Account <span className="text-orange-600">Settings</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your personal information and preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Nav */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-2 shadow-sm overflow-hidden">
               {tabs.map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                     activeTab === tab.id 
                       ? "bg-slate-900 text-white shadow-lg" 
                       : "text-slate-500 hover:bg-slate-50"
                   }`}
                 >
                   <tab.icon size={18} />
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-600/20">
               <Shield size={32} className="mb-4 text-orange-200" />
               <h4 className="font-black text-xl leading-tight">Identity Verified</h4>
               <p className="text-orange-100/80 text-sm mt-2 font-medium">Your DEO credentials are cryptographically secured and verified by the State Education Board.</p>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden backdrop-blur-sm bg-opacity-95 p-8">
            {activeTab === "profile" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                  <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center font-black text-3xl text-slate-400 border-4 border-white shadow-xl">
                    {user?.first_name?.[0] || "U"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{user?.first_name} {user?.last_name}</h2>
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black tracking-widest uppercase">
                      Official {role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                       <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="text" 
                         defaultValue={`${user?.first_name} ${user?.last_name}`}
                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-semibold"
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                       <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="email" 
                         defaultValue={user?.email}
                         className="w-full pl-12 pr-4 py-3.5 bg-slate-200 border border-slate-200 rounded-2xl outline-none font-semibold cursor-not-allowed opacity-70 text-slate-600"
                         disabled
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Organization</label>
                    <div className="relative">
                       <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="text" 
                         defaultValue="District Education Office"
                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-semibold"
                       />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                   <button className="px-6 py-3 font-bold text-slate-500 hover:text-slate-900 transition-colors">Discard</button>
                   <button className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                     Save Changes
                   </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <header>
                   <h3 className="text-xl font-black">Security Credentials</h3>
                   <p className="text-slate-400 font-medium text-sm">Update your password and maintain multi-factor settings.</p>
                </header>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                         <input type="password" placeholder="New Password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                         <input type="password" placeholder="Confirm New Password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                      </div>
                   </div>
                </div>
                
                <div className="pt-6 flex justify-end">
                   <button className="px-8 py-3 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                     Update Credentials
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
