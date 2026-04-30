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
} from "lucide-react";
import { adminService } from "../../services/admin.service";
import { toast } from "react-toastify";

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-slate-500", text: "text-slate-300" },
  awaiting_deposit: { label: "Awaiting Deposit", dot: "bg-amber-400", text: "text-amber-300" },
  published: { label: "Published", dot: "bg-cyan-400", text: "text-cyan-300" },
  open: { label: "Open", dot: "bg-emerald-400", text: "text-emerald-300" },
  locked: { label: "Locked", dot: "bg-amber-400", text: "text-amber-300" },
  started: { label: "Live", dot: "bg-orange-400", text: "text-orange-300" },
  ongoing: { label: "Live", dot: "bg-orange-400", text: "text-orange-300" },
  in_progress: { label: "Live", dot: "bg-orange-400", text: "text-orange-300" },
  ready_to_start: { label: "Ready", dot: "bg-violet-400", text: "text-violet-300" },
  completed: { label: "Completed", dot: "bg-slate-400", text: "text-slate-400" },
  cancelled: { label: "Cancelled", dot: "bg-red-400", text: "text-red-400" },
};

function TournamentCard({
  tournament,
  onNavigate,
}: {
  tournament: Record<string, unknown>;
  onNavigate: (id: string) => void;
}) {
  const id = String(tournament._id || tournament.id || "");
  const title = String(tournament.title || "Untitled");
  const status = String(tournament.status || "unknown");
  const meta = STATUS_META[status] || STATUS_META.draft;

  const currentCount = Number(tournament.current_count ?? tournament.currentCount ?? 0);
  const maxParticipants = Number(tournament.max_participants ?? tournament.maxParticipants ?? 0);
  const organizer = tournament.organizer_id as Record<string, unknown> | undefined;
  const game = tournament.game_id as Record<string, unknown> | undefined;

  const liveStatuses = new Set(["open", "started", "ongoing", "in_progress"]);
  const isLive = liveStatuses.has(status);

  return (
    <div
      onClick={() => onNavigate(id)}
      className="group flex flex-col overflow-hidden rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:shadow-xl hover:shadow-black/40 transition-all cursor-pointer"
    >
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden bg-linear-to-br from-slate-800 to-slate-900 shrink-0">
        <div className="w-full h-full flex items-center justify-center">
          {game && (game as any).logoUrl ? (
            <img
              src={(game as any).logoUrl}
              alt=""
              className="w-20 h-20 object-contain opacity-30"
            />
          ) : (
            <Gamepad2 className="w-16 h-16 text-slate-700" />
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-950/90 backdrop-blur-sm border border-white/10 ${meta.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${isLive ? "animate-pulse" : ""}`} />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-3 flex flex-col flex-1">
        <h3 className="font-semibold text-white text-sm truncate group-hover:text-orange-300 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500 truncate mt-1">
          {organizer && (organizer as any).username
            ? `${(organizer as any).username}`
            : "Unknown Organizer"}
        </p>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800">
          <div>
            <p className="text-[10px] text-slate-600 uppercase">Players</p>
            <p className="text-sm font-semibold text-slate-200">
              {currentCount} / {maxParticipants}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-600 uppercase">Game</p>
            <p className="text-sm font-semibold text-slate-200 truncate">
              {game ? String((game as any).name ?? "Unknown") : "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const TournamentManagement = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

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
    } catch (error) {
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

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-orange-500/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[48px_48px]" />

        <div className="relative flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Tournaments</h1>
            <p className="text-sm text-slate-400 mt-1">
              {total > 0 ? `${total} tournaments` : "No tournaments yet"}
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
      <div className="px-6 sm:px-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 relative">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tournaments…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="sm:w-48">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
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
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8">
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
              {statusFilter || searchQuery ? "No tournaments match your filters" : "No tournaments yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={String(tournament._id || tournament.id)}
                tournament={tournament}
                onNavigate={(id) => navigate(`/admin/tournaments/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────── */}
      {tournaments.length > 0 && totalPages > 1 && (
        <div className="px-6 sm:px-8 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Page {page} of {totalPages} ({total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentManagement;
