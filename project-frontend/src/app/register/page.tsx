"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, School, HardHat } from "lucide-react";
import Link from "next/link";

type RegisterType = "school" | "contractor";

export default function RegisterPage() {
  const router = useRouter();
  const [registerType, setRegisterType] = useState<RegisterType>("school");
  const [isLoading, setIsLoading] = useState(false);

  // School form state
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [schoolPassword, setSchoolPassword] = useState("");
  const [schoolConfirmPassword, setSchoolConfirmPassword] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [showSchoolPassword, setShowSchoolPassword] = useState(false);
  const [showSchoolConfirm, setShowSchoolConfirm] = useState(false);

  // Contractor form state
  const [companyName, setCompanyName] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [contractorPhone, setContractorPhone] = useState("");
  const [contractorPassword, setContractorPassword] = useState("");
  const [contractorConfirmPassword, setContractorConfirmPassword] = useState("");
  const [showContractorPassword, setShowContractorPassword] = useState(false);
  const [showContractorConfirm, setShowContractorConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock registration
    setTimeout(() => {
      setIsLoading(false);
      router.push("/login");
    }, 1200);
  };

  const inputClass =
    "w-full h-12 bg-[#eeefe9] border border-[#b6b7af] rounded-[4px] px-4 focus-visible:outline-none focus:border-[#F54E00] focus:ring-1 focus:ring-[#F54E00] text-[#374151] placeholder:text-[#9ea096] transition-colors";

  const labelClass = "text-[15px] font-semibold text-[#23251d]";

  return (
    <div className="relative min-h-screen w-full bg-[#fdfdf8] text-[#4d4f46] flex flex-col font-sans">
      {/* Header Area */}
      <header className="absolute top-0 w-full flex items-center justify-between p-6">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="h-8 w-8 bg-[#F54E00] rounded-[4px] flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
            <ShieldCheck className="text-white w-full h-full" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#23251d]">
            InfraRakshak
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-24 pb-12">
        {/* Central Container Block */}
        <div className="w-full max-w-[520px] flex flex-col">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.20] text-[#23251d] mb-4">
              Register on{" "}
              <span className="text-[#F54E00]">InfraRakshak</span>
            </h1>
            <p className="text-[16px] text-[#4d4f46] leading-[1.50]">
              Create your account to securely manage and monitor infrastructure
              operations across your district.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => setRegisterType("school")}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-[6px] text-[15px] font-semibold border transition-all ${
                registerType === "school"
                  ? "bg-[#F54E00] text-white border-[#F54E00] shadow-[0_2px_0_0_#b17816]"
                  : "bg-[#eeefe9] text-[#4d4f46] border-[#b6b7af] hover:border-[#F54E00] hover:text-[#F54E00]"
              }`}
            >
              <School className="w-5 h-5" />
              School Register
            </button>
            <button
              type="button"
              onClick={() => setRegisterType("contractor")}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-[6px] text-[15px] font-semibold border transition-all ${
                registerType === "contractor"
                  ? "bg-[#F54E00] text-white border-[#F54E00] shadow-[0_2px_0_0_#b17816]"
                  : "bg-[#eeefe9] text-[#4d4f46] border-[#b6b7af] hover:border-[#F54E00] hover:text-[#F54E00]"
              }`}
            >
              <HardHat className="w-5 h-5" />
              Contractor Register
            </button>
          </div>

          {/* ─── SCHOOL REGISTRATION FORM ─── */}
          {registerType === "school" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* School ID */}
              <div className="space-y-2">
                <label className={labelClass}>School ID</label>
                <input
                  type="text"
                  placeholder="Enter school ID"
                  required
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* School Name */}
              <div className="space-y-2">
                <label className={labelClass}>School Name</label>
                <input
                  type="text"
                  placeholder="Enter school name"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* School Email */}
              <div className="space-y-2">
                <label className={labelClass}>School Email</label>
                <input
                  type="email"
                  placeholder="Enter official school email"
                  required
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  required
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className={labelClass}>District</label>
                <input
                  type="text"
                  placeholder="Enter district name"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  placeholder="Enter school address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* School Type */}
              <div className="space-y-2">
                <label className={labelClass}>School Type</label>
                <select
                  required
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ea096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center" }}
                >
                  <option value="" disabled>
                    Select school type
                  </option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showSchoolPassword ? "text" : "password"}
                    placeholder="Create password"
                    required
                    value={schoolPassword}
                    onChange={(e) => setSchoolPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSchoolPassword(!showSchoolPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ea096] hover:text-[#F54E00] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showSchoolPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showSchoolConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    value={schoolConfirmPassword}
                    onChange={(e) => setSchoolConfirmPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSchoolConfirm(!showSchoolConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ea096] hover:text-[#F54E00] transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showSchoolConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#F54E00] text-white hover:bg-[#F54E00]/70 active:scale-[0.98] text-[15px] font-semibold rounded-[6px] mt-2 shadow-[0_2px_0_0_#b17816] transition-all flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? "Registering School..." : "Register School"}
              </button>
            </form>
          )}

          {/* ─── CONTRACTOR REGISTRATION FORM ─── */}
          {registerType === "contractor" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company Name */}
              <div className="space-y-2">
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Licence Number */}
              <div className="space-y-2">
                <label className={labelClass}>Licence Number</label>
                <input
                  type="text"
                  placeholder="Enter licence number"
                  required
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  required
                  value={contractorPhone}
                  onChange={(e) => setContractorPhone(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showContractorPassword ? "text" : "password"}
                    placeholder="Create password"
                    required
                    value={contractorPassword}
                    onChange={(e) => setContractorPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowContractorPassword(!showContractorPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ea096] hover:text-[#F54E00] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showContractorPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showContractorConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    value={contractorConfirmPassword}
                    onChange={(e) =>
                      setContractorConfirmPassword(e.target.value)
                    }
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowContractorConfirm(!showContractorConfirm)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ea096] hover:text-[#F54E00] transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showContractorConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#F54E00] text-white hover:bg-[#F54E00]/70 active:scale-[0.98] text-[15px] font-semibold rounded-[6px] mt-2 shadow-[0_2px_0_0_#b17816] transition-all flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? "Registering Contractor..." : "Register Contractor"}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-8 pt-8 border-t border-[#bfc1b7] text-center">
            <p className="text-[15px] text-[#4d4f46] mb-4">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-10 px-6 bg-[#1e1f23] text-white hover:bg-opacity-90 hover:text-[#F7A501] text-[15px] font-semibold rounded-[4px] transition-colors"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
