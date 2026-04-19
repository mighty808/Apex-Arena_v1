import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Loader2,
  Search,
  Swords,
  Trophy,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  tournamentService,
  type MyTournamentRegistration,
  type Tournament,
} from "../../../services/tournament.service";
import { TOURNAMENT_ENDPOINTS } from "../../../config/api.config";
import { apiGet } from "../../../utils/api.utils";
import {
  RegistrationCard,
  RegisterModal,
  TournamentCard,
  WithdrawModal,
  canWithdrawRegistration,
} from "../../../components/join-tournament";

interface GameFilter {
  id: string;
  name: string;
}

type ActiveTab = "browse" | "registrations" | "my-tournaments";

const STATUS_PILLS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "published", label: "Published" },
  { value: "started", label: "Started" },
  { value: "completed", label: "Completed" },
];

// Tournament statuses that are "live/done" → show in My Tournaments tab
const ACTIVE_TOURNAMENT_STATUSES = new Set(["started", "ongoing", "completed"]);
// Tournament statuses that are "upcoming/pending" → show in My Registrations tab
const UPCOMING_TOURNAMENT_STATUSES = new Set([
  "open",
  "published",
  "locked",
  "awaiting_deposit",
  "draft",
]);

const JoinTournament = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>("browse");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<
    MyTournamentRegistration[]
  >([]);
  const [registrationByTournament, setRegistrationByTournament] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [withdrawingTournamentId, setWithdrawingTournamentId] = useState<
    string | null
  >(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [freeFilter, setFreeFilter] = useState<"" | "free" | "paid">("");
  const [gameFilter, setGameFilter] = useState("");
  const [availableGames, setAvailableGames] = useState<GameFilter[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [withdrawTarget, setWithdrawTarget] =
    useState<MyTournamentRegistration | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawReasonError, setWithdrawReasonError] = useState<string | null>(
    null,
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasFetchedGames = useRef(false);

  const fetchMyRegistrations = useCallback(async () => {
    setIsLoadingRegistrations(true);
    try {
      const registrations = await tournamentService.getMyRegistrations();
      setMyRegistrations(registrations);
      const map = registrations.reduce<Record<string, string>>((acc, item) => {
        if (!acc[item.tournamentId]) {
          acc[item.tournamentId] = item.status;
        }
        return acc;
      }, {});
      setRegistrationByTournament(map);
    } catch {
      setMyRegistrations([]);
      setRegistrationByTournament({});
    } finally {
      setIsLoadingRegistrations(false);
    }
  }, []);

  const fetchTournaments = useCallback(
    async (pg: number) => {
      setIsLoading(true);
      try {
        const result = await tournamentService.getTournaments({
          page: pg,
          limit: 12,
          search: search || undefined,
          status: statusFilter || undefined,
          isFree:
            freeFilter === "free"
              ? true
              : freeFilter === "paid"
                ? false
                : undefined,
          gameId: gameFilter || undefined,
        });
        setTournaments(result.tournaments);
        setTotalPages(result.pagination.pages);
      } catch {
        setTournaments([]);
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter, freeFilter, gameFilter],
  );

  useEffect(() => {
    void fetchTournaments(page);
  }, [fetchTournaments, page]);

  useEffect(() => {
    void fetchMyRegistrations();
  }, [fetchMyRegistrations]);

  useEffect(() => {
    if (hasFetchedGames.current) return;
    hasFetchedGames.current = true;
    apiGet(TOURNAMENT_ENDPOINTS.GAMES)
      .then((res) => {
        if (!res.success) return;
        const raw = res.data as Record<string, unknown>;
        const list = Array.isArray(raw)
          ? raw
          : ((raw.games ?? raw.data ?? []) as Record<string, unknown>[]);
        setAvailableGames(
          list.map((g) => ({
            id: String((g as Record<string, unknown>)._id ?? ""),
            name: String((g as Record<string, unknown>).name ?? ""),
          })),
        );
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchTournaments(1);
  };

  const handleRegisterSuccess = () => {
    setSelectedTournament(null);
    setErrorMsg(null);
    setSuccessMsg(
      "You've successfully joined the tournament! Check your registrations for details.",
    );
    void Promise.all([fetchTournaments(page), fetchMyRegistrations()]);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleWithdrawRequest = (registration: MyTournamentRegistration) => {
    if (!canWithdrawRegistration(registration.status)) return;
    setWithdrawTarget(registration);
    setWithdrawReason("");
    setWithdrawReasonError(null);
  };

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    const reason = withdrawReason.trim();
    if (!reason) {
      setWithdrawReasonError("Withdrawal reason is required.");
      return;
    }
    setWithdrawingTournamentId(withdrawTarget.tournamentId);
    setErrorMsg(null);
    setSuccessMsg(null);
    setWithdrawReasonError(null);
    try {
      await tournamentService.unregister(withdrawTarget.tournamentId, reason);
      setSuccessMsg(
        "Withdraw successful. If eligible, any refundable amount will be processed.",
      );
      setWithdrawTarget(null);
      setWithdrawReason("");
      setWithdrawReasonError(null);
      void Promise.all([fetchTournaments(page), fetchMyRegistrations()]);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Failed to withdraw from tournament.",
      );
    } finally {
      setWithdrawingTournamentId(null);
    }
  };

  const isConfirmingWithdraw =
    withdrawTarget !== null &&
    withdrawingTournamentId === withdrawTarget.tournamentId;

  // Split registrations into two buckets
  const upcomingRegistrations = myRegistrations.filter((r) =>
    UPCOMING_TOURNAMENT_STATUSES.has(r.tournamentStatus),
  );
  const activeTournaments = myRegistrations.filter((r) =>
    ACTIVE_TOURNAMENT_STATUSES.has(r.tournamentStatus),
  );

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "browse",
      label: "Browse",
      icon: <Search className="w-3.5 h-3.5" />,
    },
    {
      id: "registrations",
      label: "My Registrations",
      icon: <Trophy className="w-3.5 h-3.5" />,
      count: isLoadingRegistrations ? undefined : upcomingRegistrations.length,
    },
    {
      id: "my-tournaments",
      label: "My Tournaments",
      icon: <Swords className="w-3.5 h-3.5" />,
      count: isLoadingRegistrations ? undefined : activeTournaments.length,
    },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-cyan-400" />
          Tournaments
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse, join, and track your tournament activity.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.id === "browse" ? "Browse" : tab.id === "registrations" ? "Registered" : "Active"}
            </span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  activeTab === tab.id
                    ? "bg-slate-950/25 text-slate-950"
                    : "bg-cyan-500/20 text-cyan-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── BROWSE TAB ── */}
      {activeTab === "browse" && (
        <div className="space-y-5">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments..."
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_PILLS.map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => {
                    setStatusFilter(pill.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === pill.value
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:block w-px h-5 bg-slate-700" />

            <div className="flex items-center gap-1.5">
              {(["", "free", "paid"] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setFreeFilter(val);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    freeFilter === val
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                  }`}
                >
                  {val === "" ? "All Fees" : val === "free" ? "Free" : "Paid"}
                </button>
              ))}
            </div>

            {availableGames.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={gameFilter}
                  onChange={(e) => {
                    setGameFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs text-white focus:outline-none"
                >
                  <option value="">All Games</option>
                  {availableGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : tournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-slate-600" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                No Tournaments Found
              </h2>
              <p className="text-sm text-slate-400 max-w-xs">
                No tournaments match your filters. Try adjusting your search or
                check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  registrationStatus={registrationByTournament[t.id]}
                  isLoadingRegistrations={isLoadingRegistrations}
                  onRegister={setSelectedTournament}
                  onOpenDetails={(id) => navigate(`/auth/tournaments/${id}`)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MY REGISTRATIONS TAB ── */}
      {activeTab === "registrations" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Upcoming tournaments you've registered for. You can withdraw while
            registration is still open.
          </p>

          {isLoadingRegistrations ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : upcomingRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-slate-600" />
              </div>
              <h2 className="text-base font-semibold text-white mb-2">
                No upcoming registrations
              </h2>
              <p className="text-sm text-slate-400 max-w-xs mb-4">
                Browse open tournaments and join one to see it here.
              </p>
              <button
                onClick={() => setActiveTab("browse")}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors"
              >
                Browse Tournaments
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingRegistrations.map((registration) => (
                <RegistrationCard
                  key={registration.registrationId}
                  registration={registration}
                  canWithdraw={canWithdrawRegistration(registration.status)}
                  isWithdrawing={
                    withdrawingTournamentId === registration.tournamentId
                  }
                  onRequestWithdraw={handleWithdrawRequest}
                  onOpenDetails={(id) => navigate(`/auth/tournaments/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY TOURNAMENTS TAB ── */}
      {activeTab === "my-tournaments" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Tournaments that are live or completed — view brackets, results, and
            your match schedule.
          </p>

          {isLoadingRegistrations ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : activeTournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Swords className="w-8 h-8 text-slate-600" />
              </div>
              <h2 className="text-base font-semibold text-white mb-2">
                No active tournaments
              </h2>
              <p className="text-sm text-slate-400 max-w-xs">
                Once a tournament you've joined starts, it'll appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTournaments.map((registration) => (
                <ActiveTournamentCard
                  key={registration.registrationId}
                  registration={registration}
                  onView={(id) => navigate(`/auth/tournaments/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawTarget && (
        <WithdrawModal
          target={withdrawTarget}
          reason={withdrawReason}
          reasonError={withdrawReasonError}
          isSubmitting={isConfirmingWithdraw}
          onReasonChange={(value) => {
            setWithdrawReason(value);
            if (withdrawReasonError && value.trim().length > 0) {
              setWithdrawReasonError(null);
            }
          }}
          onClose={() => {
            setWithdrawTarget(null);
            setWithdrawReason("");
            setWithdrawReasonError(null);
          }}
          onConfirm={() => {
            void handleWithdraw();
          }}
        />
      )}

      {/* Register Modal */}
      {selectedTournament && (
        <RegisterModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          onSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  );
};

// ── Inline card for active/completed tournaments ──────────────────────────────
const STATUS_ACCENT_MY: Record<string, string> = {
  started: "from-blue-500 to-indigo-600",
  ongoing: "from-blue-500 to-indigo-600",
  completed: "from-slate-500 to-slate-600",
};
const STATUS_BADGE_MY: Record<string, string> = {
  started: "bg-blue-500/20 text-blue-300",
  ongoing: "bg-blue-500/20 text-blue-300",
  completed: "bg-slate-600/30 text-slate-400",
};
const STATUS_LABEL_MY: Record<string, string> = {
  started: "Live",
  ongoing: "Live",
  completed: "Completed",
};

function ActiveTournamentCard({
  registration,
  onView,
}: {
  registration: MyTournamentRegistration;
  onView: (id: string) => void;
}) {
  const accentGradient =
    STATUS_ACCENT_MY[registration.tournamentStatus] ?? "from-slate-500 to-slate-600";
  const badgeColor =
    STATUS_BADGE_MY[registration.tournamentStatus] ?? "bg-slate-700/60 text-slate-300";
  const statusLabel =
    STATUS_LABEL_MY[registration.tournamentStatus] ??
    registration.tournamentStatus.replace(/_/g, " ");
  const isLive =
    registration.tournamentStatus === "started" ||
    registration.tournamentStatus === "ongoing";

  return (
    <div
      className="group rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col overflow-hidden hover:border-slate-600 hover:shadow-lg hover:shadow-black/40 transition-all cursor-pointer"
      onClick={() => onView(registration.tournamentId)}
    >
      <div className={`h-1 w-full bg-linear-to-r ${accentGradient}`} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Game + status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400 truncate">
            {registration.tournamentGameName ?? "Game"}
          </span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 ${badgeColor}`}
          >
            {isLive && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            )}
            {statusLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-cyan-100 transition-colors">
          {registration.tournamentTitle}
        </h3>

        {/* Registration status */}
        <div className="text-xs text-slate-500">
          Your status:{" "}
          <span className="text-slate-300 font-medium capitalize">
            {registration.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* View button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(registration.tournamentId);
          }}
          className="mt-auto w-full py-2.5 rounded-lg text-sm font-semibold transition-all bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center justify-center gap-2"
        >
          <Swords className="w-3.5 h-3.5" />
          {isLive ? "View Live Tournament" : "View Results"}
        </button>
      </div>
    </div>
  );
}

export default JoinTournament;
