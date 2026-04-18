"use client";

import {
  Briefcase,
  Gavel,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useApi } from "@/hooks/use-api";
import { API } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  role: string;
  email: string;
  stats: {
    assigned_contracts?: number;
    active_bids?: number;
  };
}

interface Contract {
  id: number;
  title: string;
  school: number | { id: number; name: string };
  category: string;
  estimated_cost: string;
  status: string;
  priority_level: string;
  bid_start_date?: string;
  bid_end_date?: string;
  created_at: string;
}

interface ContractBid {
  id: number;
  contract: number | { id: number; title: string };
  bid_amount: string;
  estimated_days: number;
  submitted_at: string;
  contractor?: number;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function contractStatusBadge(status: string) {
  const m: Record<string, string> = {
    OPEN: "text-blue-700 bg-blue-50 border-blue-200",
    IN_BIDDING: "text-amber-700 bg-amber-50 border-amber-200",
    AWARDED: "text-purple-700 bg-purple-50 border-purple-200",
    IN_PROGRESS: "text-[#F54E00] bg-orange-50 border-orange-200",
    COMPLETED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    CANCELLED: "text-red-700 bg-red-50 border-red-200",
  };
  return m[status?.toUpperCase()] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

function priorityBadge(level: string) {
  const m: Record<string, string> = {
    HIGH: "text-red-700 bg-red-50 border-red-200",
    MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
    LOW: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
  return m[level?.toUpperCase()] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

function formatCost(cost: string | number) {
  const n = typeof cost === "string" ? parseFloat(cost) : cost;
  if (isNaN(n)) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function schoolName(school: Contract["school"]): string {
  if (typeof school === "object" && school !== null) return school.name;
  return `School #${school}`;
}

function contractTitle(c: ContractBid["contract"]): string {
  if (typeof c === "object" && c !== null) return c.title;
  return `Contract #${c}`;
}

function Spinner() {
  return (
    <div className="py-12 flex justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-[#b6b7af]" />
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="py-10 flex flex-col items-center gap-3 text-[#9ea096]">
      <AlertCircle className="w-7 h-7 opacity-40" />
      <p className="text-sm font-semibold text-center max-w-xs">{message}</p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${accent}`} />
      <div className={`p-3 rounded-xl w-fit mb-4 ${accent} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${accent.replace("bg-", "text-")}`} />
      </div>
      <p className="text-[10px] font-black text-[#9ea096] uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-[#23251d]">
        {value ?? <span className="text-[#b6b7af]">—</span>}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractorDashboard() {
  const isMounted = useIsMounted();
  const { user } = useAuthStore();

  const { data: dashData, loading: dashLoading } = useApi<DashboardStats>(API.dashboard);

  // My active/awarded contracts
  const { data: myContractsRaw, loading: contractsLoading } =
    useApi<PaginatedResponse<Contract>>(
      `${API.contracts.list}?ordering=-created_at&page_size=5`
    );

  // Open tenders (available for bidding)
  const { data: openTendersRaw, loading: tendersLoading } =
    useApi<PaginatedResponse<Contract>>(
      `${API.contracts.list}?status=OPEN&ordering=-created_at&page_size=5`
    );

  // My bids
  const { data: myBidsRaw, loading: bidsLoading } =
    useApi<PaginatedResponse<ContractBid>>(
      `${API.contracts.bids}?ordering=-submitted_at&page_size=5`
    );

  const stats = dashData?.stats;
  const myContracts = myContractsRaw?.results ?? [];
  const openTenders = openTendersRaw?.results ?? [];
  const myBids = myBidsRaw?.results ?? [];

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#23251d] tracking-tight mb-1">
            Contractor <span className="text-[#F54E00]">Console</span>
          </h1>
          <p className="text-[#4d4f46]">
            Welcome, <span className="font-bold">{user?.email ?? "Partner"}</span>. Track your bids, active contracts, and open tenders.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <KpiCard
          title="Assigned Contracts"
          value={stats?.assigned_contracts}
          icon={Briefcase}
          accent="bg-[#F54E00]"
        />
        <KpiCard
          title="Active Bids"
          value={stats?.active_bids}
          icon={Gavel}
          accent="bg-amber-600"
        />
        <KpiCard
          title="Open Tenders"
          value={openTendersRaw?.count}
          icon={CheckCircle2}
          accent="bg-blue-600"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Contracts */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-[#b6b7af]/50 bg-white/30">
            <h2 className="text-lg font-black text-[#23251d]">My Contracts</h2>
          </div>
          {contractsLoading ? (
            <Spinner />
          ) : myContracts.length === 0 ? (
            <Empty message="No contracts assigned to you yet. Submit a bid on an open tender." />
          ) : (
            <div className="divide-y divide-[#b6b7af]/30">
              {myContracts.map((c) => (
                <div key={c.id} className="px-6 py-4 hover:bg-white/40 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#23251d] text-sm truncate">{c.title}</p>
                      <p className="text-[10px] text-[#9ea096] font-bold uppercase mt-0.5">
                        {schoolName(c.school)} · {c.category}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase ${contractStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                      <p className="text-sm font-black text-[#23251d] mt-1 flex items-center gap-1 justify-end">
                        <IndianRupee className="w-3 h-3" />
                        {formatCost(c.estimated_cost)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase ${priorityBadge(c.priority_level)}`}>
                      {c.priority_level} Priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Tenders */}
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-[#b6b7af]/50 bg-white/30 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#23251d]">Open Tenders</h2>
            {openTendersRaw && openTendersRaw.count > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200">
                {openTendersRaw.count} OPEN
              </span>
            )}
          </div>
          {tendersLoading ? (
            <Spinner />
          ) : openTenders.length === 0 ? (
            <Empty message="No open tenders available in your area right now." />
          ) : (
            <div className="divide-y divide-[#b6b7af]/30">
              {openTenders.map((c) => (
                <div key={c.id} className="px-6 py-4 group hover:bg-white/40 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-[#9ea096] uppercase mb-0.5">
                        {c.category}
                      </p>
                      <p className="font-semibold text-[#23251d] text-sm group-hover:text-[#F54E00] transition-colors truncate">
                        {c.title}
                      </p>
                      <p className="text-[10px] text-[#9ea096] font-bold uppercase mt-0.5">
                        {schoolName(c.school)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-black text-[#23251d] flex items-center gap-1 justify-end">
                        <IndianRupee className="w-3 h-3" />
                        {formatCost(c.estimated_cost)}
                      </p>
                      {c.bid_end_date && (
                        <p className="text-[9px] text-[#9ea096] mt-0.5">
                          Ends {new Date(c.bid_end_date).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase ${priorityBadge(c.priority_level)}`}>
                      {c.priority_level} Priority
                    </span>
                    <button className="text-[10px] font-black text-white bg-[#23251d] px-3 py-1.5 rounded-lg hover:bg-[#F54E00] transition-colors">
                      Submit Bid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Bids */}
      {(bidsLoading || myBids.length > 0) && (
        <div className="bg-[#eeefe9] border border-[#b6b7af] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-[#b6b7af]/50 bg-white/30">
            <h2 className="text-lg font-black text-[#23251d]">My Recent Bids</h2>
          </div>
          {bidsLoading ? (
            <Spinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-[#9ea096] border-b border-[#b6b7af]/40 bg-white/10">
                    <th className="px-6 py-4">Contract</th>
                    <th className="px-6 py-4">Bid Amount</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b6b7af]/20">
                  {myBids.map((b) => (
                    <tr key={b.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#23251d] text-sm">
                          {contractTitle(b.contract)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-[#23251d] flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {formatCost(b.bid_amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#4d4f46]">
                        {b.estimated_days} days
                      </td>
                      <td className="px-6 py-4 text-xs text-[#9ea096]">
                        {new Date(b.submitted_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
