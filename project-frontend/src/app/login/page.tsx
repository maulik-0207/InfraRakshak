"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

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
        // Drop a mock cookie so the new Middleware detects an active session
        document.cookie = "access_token=mock-jwt-token; path=/;";

        setAuth("mock-jwt-token", "PRINCIPAL", {
            id: 1,
            email: "principal@example.com",
            username: "tech_principal",
            first_name: "Tech",
            last_name: "Principal"
        });
        setIsLoading(false);
        router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col font-sans">
      
      {/* Header Area */}
      <header className="absolute top-0 w-full flex items-center justify-between p-6">
        <div className="flex items-center gap-2 group cursor-pointer">
           <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
             <ShieldCheck className="text-primary-foreground w-full h-full" />
           </div>
           <span className="font-bold text-xl tracking-tight text-foreground">InfraRakshak</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content Node */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Central Container Block */}
        <div className="w-full max-w-[440px] flex flex-col pt-12">
          
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] leading-[1.10] text-foreground mb-3">
              Sign in to InfraRakshak
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              We securely monitor and protect external infrastructure operations across the district.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5 whitespace-nowrap">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <div className="relative group">
                <input 
                  type="email"
                  placeholder="Your official email address" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-background border border-input rounded-xl px-4 focus-visible:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground font-medium transition-all group-hover:border-foreground/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center whitespace-nowrap">
                <label className="text-sm font-semibold text-foreground">Password</label>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-background border border-input rounded-xl pl-4 pr-12 focus-visible:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground tracking-widest font-medium transition-all group-hover:border-foreground/30"
                 />
                 <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>
            </div>

            {/* Password Links Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-input text-primary focus:ring-primary" />
                <label htmlFor="remember" className="text-sm font-medium cursor-pointer text-foreground">Stay signed in</label>
              </div>
              <Link href="#" className="text-sm text-primary hover:underline font-semibold">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 bg-primary hover:bg-[#578bfa] text-white text-base font-semibold rounded-pill mt-4 transition-colors flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none" 
            >
              {isLoading ? "Authenticating..." : "Sign in"}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <Link href="/register" className="text-base text-primary hover:underline font-semibold">Create a new account</Link>
          </div>
          
        </div>
      </div>

    </div>
  );
}
