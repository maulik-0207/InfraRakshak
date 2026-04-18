"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Mock Account Database
const MOCK_ACCOUNTS: Record<string, { role: string; user: any }> = {
  "admin@infra.com": {
    role: "ADMIN",
    user: { id: 1, email: "admin@infra.com", username: "admin_user", first_name: "District", last_name: "Admin" }
  },
  "principal@infra.com": {
    role: "PRINCIPAL",
    user: { id: 2, email: "principal@infra.com", username: "principal_user", first_name: "School", last_name: "Principal" }
  },
  "staff@infra.com": {
    role: "STAFF",
    user: { id: 3, email: "staff@infra.com", username: "staff_user", first_name: "School", last_name: "Staff" }
  },
  "deo@infra.com": {
    role: "DEO",
    user: { id: 4, email: "deo@infra.com", username: "deo_user", first_name: "Data", last_name: "Operator" }
  },
  "contractor@infra.com": {
    role: "CONTRACTOR",
    user: { id: 5, email: "contractor@infra.com", username: "contractor_user", first_name: "Project", last_name: "Contractor" }
  }
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Login handling
    setTimeout(() => {
        const account = MOCK_ACCOUNTS[email.toLowerCase()] || {
          role: "PRINCIPAL",
          user: { id: 99, email: email, username: "guest_user", first_name: "Guest", last_name: "User" }
        };

        // Drop a mock cookie so the new Middleware detects an active session
        document.cookie = "access_token=mock-jwt-token; path=/;";

        setAuth("mock-jwt-token", account.role as any, account.user);
        setIsLoading(false);
        router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fdfdf8] text-[#4d4f46] flex flex-col font-sans">
      
      {/* Header Area */}
      <header className="absolute top-0 w-full flex items-center justify-between p-6">
        <div className="flex items-center group cursor-pointer">
          <Image
            src="/logo.png"
            alt="InfraRakshak Logo"
            width={160}
            height={60}
            style={{ height: "auto" }}
            className="object-contain transition-transform group-hover:scale-105"
            priority
          />
        </div>
      </header>

      {/* Main Content Node */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Central Container Block */}
        <div className="w-full max-w-[440px] flex flex-col pt-12">
          
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.20] text-[#23251d] mb-4">
              Sign in to <span className="text-[#F54E00]">InfraRakshak</span>
            </h1>
            <p className="text-[16px] text-[#4d4f46] leading-[1.50]">
              Securely monitor and protect external infrastructure operations across your district.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[15px] font-semibold text-[#23251d]">Email Address</label>
              <div className="relative group">
                <input 
                  type="email"
                  placeholder="Your official email address" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-[4px] px-4 focus-visible:outline-none focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] text-[#374151] placeholder:text-[#9ea096] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[15px] font-semibold text-[#23251d]">Password</label>
                <Link href="#" className="text-[14px] text-[#F54E00] hover:text-[#F7A501] font-semibold transition-colors">Forgot password?</Link>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-[4px] pl-4 pr-12 focus-visible:outline-none focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] text-[#374151] placeholder:text-[#9ea096] font-medium transition-colors"
                 />
                 <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ea096] hover:text-[#F54E00] transition-colors"
                  aria-label="Toggle password visibility"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-[#F54E00] text-white hover:bg-[#F54E00]/70 active:scale-[0.98] text-[15px] font-semibold rounded-[6px] mt-2 shadow-[0_2px_0_0_#b17816] transition-all flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none" 
            >
              {isLoading ? "Authenticating..." : "Sign in"}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-[#bfc1b7] text-center flex flex-col gap-4">
            <div>
              <p className="text-[15px] text-[#4d4f46] mb-4">Are you a new district administrator?</p>
              <Link href="/register" className="inline-flex items-center justify-center h-10 px-6 bg-[#1e1f23] text-white hover:bg-opacity-90 hover:text-[#F7A501] text-[15px] font-semibold rounded-[4px] transition-colors">
                Create a new account 
              </Link>
            </div>

            {/* Quick Login Section for Testing */}
            <div className="mt-4 p-4 bg-[#eeefe9] rounded-lg border border-[#bfc1b7]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9ea096] mb-3 text-center">Development: Quick Login</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.keys(MOCK_ACCOUNTS).map((mockEmail) => (
                  <button
                    key={mockEmail}
                    type="button"
                    onClick={() => {
                      setEmail(mockEmail);
                      setPassword("password");
                      // Use a small delay to ensure state updates before form submission if we wanted to auto-submit, 
                      // but manual click is better for demo control.
                    }}
                    className="px-3 py-1.5 bg-white border border-[#bfc1b7] rounded text-[12px] font-bold text-[#4d4f46] hover:border-[#F54E00] hover:text-[#F54E00] transition-colors"
                  >
                    {MOCK_ACCOUNTS[mockEmail].role}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}
