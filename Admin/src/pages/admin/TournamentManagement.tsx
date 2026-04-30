import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trophy,
  Filter,
  X,
  RefreshCw,
  Gamepad2,
  Users,
  DollarSign,
  Calendar,
  ChevronRight as ArrowRight,
} from "lucide-react";
import { adminService } from "../../services/admin.service";
import { toast } from "react-toastify";

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  draft:            { label: "Draft",            dot: "bg-slate-500",   badge: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  awaiting_deposit: { label: "Awaiting Deposit", dot: "bg-amber-400",   badge: "bg-amber-400/15 text-amber-300 border-amber-400/30" },
  published:        { label: "Published",        dot: "bg-cyan-400",    badge: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30" },
  open:             { label: "Open",             dot: "bg-emerald-400", badge: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30" },
  locked:           { label: "Locked",           dot: "bg-amber-400",   badge: "bg-amber-400/15 text-amber-300 border-amber-400/30" },
  started:          { label: "Live",             dot: "bg-orange-400",  badge: "bg-orange-400/15 text-orange-300 border-orange-400/30" },
  ongoing:          { label: "Live",             dot: "bg-orange-400",  badge: "bg-orange-400/15 text-orange-300 border-orange-400/30" },
  in_progress:      { label: "Live",             dot: "bg-orange-400",  badge: "bg-orange-400/15 text-orange-300 border-orange-400/30" },
  ready_to_start:   { label: "Ready",            dot: "bg-violet-400",  badge: "bg-violet-400/15 text-violet-300 border-violet-400/30" },
  completed:        { label: "Completed",        dot: "bg-slate-400",   badge: "bg-slate-400/15 text-slate-400 border-slate-400/30" },
  cancelled:        { label: "Cancelled",        dot: "bg-red-400",     badge: "bg-red-400/15 text-red-400 border-red-400/30" },
};

const LIVE_STATUSES = new Set(["open", "started", "ongoing", "in_progress"]);

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatGhs(pesewas?: number) {
  if (!pesewas || pesewas === 0) return "Free";
  return `GHS ${(pesewas / 100).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  const isLive = LIVE_STATUSES.has(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${isLive ? "animate-pulse" : ""}`} />
      {meta.label}
    </span>
  );
}

function TournamentRow({
  tournament,
  onNavigate,
}: {
  tournament: Record<string, unknown>;
  onNavigate: (id: string) => void;
}) {
  const id = String(tournament._id ?? tournament.id ?? "");
  const title = String(tournament.title ?? "Untitled");
  const status = String(tournament.status ?? "unknown");
  const organizer = tournament.organizer_id as Record<string, unknown> | undefined;
  const game = tournament.game_id as Record<string, unknown> | undefined;
  const schedule = tournament.schedule as Record<string, unknown> | undefined;

  const capacity = tournament.capacity as Record<string, unknown> | undefined;
  const currentCount = Number(
    capacity?.current_participants ?? tournament.current_count ?? tournament.currentCount ?? 0
  );
  const maxParticipants = Number(
    capacity?.max_participants ?? tournament.max_participants ?? tournament.maxParticipants ?? 0
  );
  const entryFee = Number(tournament.entry_fee ?? 0);
  const prizePool = Number(
    (tournament.prize_structure as any)?.net_prize_pool ?? tournament.prizePool ?? 0
  );
  const format = String(tournament.format ?? "");
  const region = String(tournament.region ?? "");

  const tournamentStart = String(schedule?.tournament_start ?? "");
  const fillPct = maxParticipants > 0 ? Math.round((currentCount / maxParticipants) * 100) : 0;

  return (
    <tr
      onClick={() => onNavigate(id)}
      className="group border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
    >
      {/* Tournament */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {game && ((game as any).logo_url || (game as any).icon_url || (game as any).logoUrl) ? (
              <img src={(game as any).logo_url ?? (game as any).icon_url ?? (game as any).logoUrl} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <Gamepad2 className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-orange-300 transition-colors max-w-[200px]">
              {title}
            </p>
            <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
              {id.slice(0, 20)}…
            </p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4 whitespace-nowrap">
        <StatusBadge status={status} />
      </td>

      {/* Game */}
      <td className="px-4 py-4">
        <p className="text-sm text-slate-200 truncate max-w-[120px]">
          {game ? String((game as any).name ?? "Unknown") : "Unknown"}
        </p>
      </td>

      {/* Organizer */}
      <td className="px-4 py-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-200 truncate max-w-[130px]">
            {organizer ? String((organizer as any).username ?? "Unknown") : "Unknown"}
          </p>
          {organizer && (organizer as any).email && (
            <p className="text-xs text-slate-500 truncate max-w-[130px]">
              {String((organizer as any).email)}
            </p>
          )}
        </div>
      </td>

      {/* Format / Region */}
      <td className="px-4 py-4">
        <p className="text-sm text-slate-200">{format || "—"}</p>
        {region && <p className="text-xs text-slate-500">{region}</p>}
      </td>

      {/* Players */}
      <td className="px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {currentCount}
            <span className="text-slate-500 font-normal"> / {maxParticipants}</span>
          </p>
          {maxParticipants > 0 && (
            <div className="mt-1.5 h-1 w-20 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fillPct >= 100 ? "bg-orange-400" : fillPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${Math.min(fillPct, 100)}%` }}
              />
            </div>
          )}
        </div>
      </td>

      {/* Entry Fee */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-sm text-slate-200">{formatGhs(entryFee)}</p>
      </td>

      {/* Prize Pool */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-sm font-semibold text-amber-300">{formatGhs(prizePool)}</p>
      </td>

      {/* Start Date */}
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-sm text-slate-200">{formatDate(tournamentStart)}</p>
      </td>

      {/* Arrow */}
      <td className="px-4 py-4">
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </td>
    </tr>
  );
}

const COLUMN_HEADERS = [
  { label: "Tournament", icon: Trophy },
  { label: "Status" },
  { label: "Game", icon: Gamepad2 },
  { label: "Organizer" },
  { label: "Format / Region" },
  { label: "Players", icon: Users },
  { label: "Entry Fee", icon: DollarSign },
  { label: "Prize Pool", icon: DollarSign },
  { label: "Starts", icon: Calendar },
  { label: "" },
];

const TournamentManagement = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminService.listTournaments({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setTournaments(result.data);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load tournaments");
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="space-y-0">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-orange-500/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[48px_48px]" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Tournaments</h1>
            <p className="text-sm text-slate-400 mt-1">
              {total > 0 ? `${total} tournament${total !== 1 ? "s" : ""}` : "No tournaments yet"}
            </p>
          </div>
          <button
            onClick={() => load()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-8 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="sm:w-52 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="awaiting_deposit">Awaiting Deposit</option>
            <option value="published">Published</option>
            <option value="open">Open</option>
            <option value="locked">Locked</option>
            <option value="started">Started</option>
            <option value="ongoing">Ongoing</option>
            <option value="in_progress">In Progress</option>
            <option value="ready_to_start">Ready to Start</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-6">
        {isLoading && !tournaments.length ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Loading tournaments…</span>
            </div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 py-20 px-6 text-center">
            <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="font-display text-xl font-semibold text-slate-400">No tournaments</p>
            <p className="text-sm text-slate-600 mt-2">
              {statusFilter || searchQuery
                ? "No tournaments match your filters"
                : "No tournaments yet"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/70 border-b border-slate-700">
                    {COLUMN_HEADERS.map((col, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap first:px-5"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-slate-900">
                  {tournaments.map((tournament) => (
                    <TournamentRow
                      key={String(tournament._id ?? tournament.id)}
                      tournament={tournament}
                      onNavigate={(id) => navigate(`/admin/tournaments/${id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────── */}
      {total > 0 && (
        <div className="px-6 sm:px-8 pb-8 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {total > limit
              ? `Showing ${start}–${end} of ${total}`
              : `${total} tournament${total !== 1 ? "s" : ""}`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7
                    ? i + 1
                    : page <= 4
                    ? i + 1
                    : page >= totalPages - 3
                    ? totalPages - 6 + i
                    : page - 3 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      disabled={isLoading}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-amber-500 text-slate-900 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-white/5 border border-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentManagement;
