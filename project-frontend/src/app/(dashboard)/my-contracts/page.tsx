"use client";

import { useAuthStore } from "@/store/auth-store";
import { Gavel, CheckCircle2, XCircle, Timer } from "lucide-react";

export default function MyContractsPage() {
  const { role } = useAuthStore();

  const myBids = [
    { id: "BID-881", title: "Classroom Partition Installation", school: "Central Model High", amount: "$1,200", status: "SUCCESSFUL" },
    { id: "BID-902", title: "Basement Drainage Correction", school: "District Girls School", amount: "$3,450", status: "NOT_SUCCESSFUL" },
    { id: "BID-915", title: "IT Lab Cooling System", school: "Technical Institute", amount: "$2,100", status: "UNDER_REVIEW" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#23251d]">
            My <span className="text-[#F54E00]">Bids</span>
          </h1>
          <p className="text-[#4d4f46] mt-1 font-medium">Track the status of your submitted project proposals.</p>
        </div>
      </div>
      
      <div className="bg-card border border-[#bfc1b7] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#eeefe9]/50 border-b border-[#bfc1b7]">
                <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-[#9ea096]">Bid ID</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-[#9ea096]">Project Title</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-[#9ea096]">Amount</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-[#9ea096]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bfc1b7]">
              {myBids.map((bid) => (
                <tr key={bid.id} className="hover:bg-[#eeefe9]/20 transition-colors">
                  <td className="p-4 text-sm font-bold text-[#1e1f23]">{bid.id}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#23251d]">{bid.title}</span>
                      <span className="text-xs text-[#65675e]">{bid.school}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-[#4d4f46]">{bid.amount}</td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] border text-[11px] font-bold uppercase tracking-wide shadow-sm ${
                      bid.status === "SUCCESSFUL" ? "bg-green-50 text-green-700 border-green-200" :
                      bid.status === "NOT_SUCCESSFUL" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-orange-50 text-orange-700 border-orange-200"
                    }`}>
                      {bid.status === "SUCCESSFUL" && <CheckCircle2 size={12} />}
                      {bid.status === "NOT_SUCCESSFUL" && <XCircle size={12} />}
                      {bid.status === "UNDER_REVIEW" && <Timer size={12} />}
                      {bid.status.replace("_", " ")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-[#fdfdf8] border border-dashed border-[#bfc1b7] rounded-lg text-center">
         <p className="text-xs text-[#9ea096] font-medium leading-relaxed">
           Showing {myBids.length} entries. High-priority statuses are updated every 24 hours.
         </p>
      </div>
    </div>
  );
}
