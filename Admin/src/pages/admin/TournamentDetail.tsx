// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Trophy,
  Calendar,
  Users,
  Gamepad2,
  DollarSign,
  Clock,
  CheckCircle2,
  User,
  MapPin,
  Zap,
  Activity,
  Lock,
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

const BLOCKED_STATUSES = new Set([
  "started",
  "ongoing",
  "in_progress",
  "ready_to_start",
]);

function formatDate(iso?: string) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGhsFromPesewas(amount?: number) {
  if (!amount || amount === 0) return "Free";
  return `GHS ${(amount / 100).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subvalue,
}: {
  icon: React.ComponentType<{ className: string }>;
  label: string;
  value: React.ReactNode;
  subvalue?: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-sm font-semibold text-white break-words mt-0.5">{value}</p>
          {subvalue && <p className="text-xs text-slate-500 mt-1">{subvalue}</p>}
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  tournament,
  onClose,
  onConfirm,
  loading,
}: {
  tournament: Record<string, unknown> | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!tournament) return null;

  const status = String(tournament.status || "");
  const isBlocked = BLOCKED_STATUSES.has(status);
  const title = String(tournament.title || "Tournament");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Tournament</h3>
              <p className="text-xs text-slate-400">{title}</p>
            </div>
          </div>

          {isBlocked && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">
                Cannot delete {status.replace(/_/g, " ")} tournaments. The tournament is currently active.
              </div>
            </div>
          )}

          {!isBlocked && (
            <p className="text-sm text-slate-400">
              Are you sure? This action cannot be undone.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              Cancel
            </button>
            {!isBlocked && (
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-40"
              >
                {loading ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const TournamentDetail = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();

  const [tournament, setTournament] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!tournamentId) return;

    setIsLoading(true);
    try {
      const result = await adminService.listTournaments({ limit: 1000 });
      const found = result.data.find(
        (t: any) => t._id === tournamentId || t.id === tournamentId
      );
      if (found) {
        setTournament(found);
      } else {
        toast.error("Tournament not found");
        navigate("/admin/tournaments");
      }
    } catch (error) {
      toast.error("Failed to load tournament");
      navigate("/admin/tournaments");
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleConfirmDelete = async () => {
    if (!tournament || !tournamentId) return;

    setIsDeleting(true);
    try {
      const success = await adminService.deleteTournament(tournamentId);
      if (success) {
        toast.success("Tournament deleted successfully");
        navigate("/admin/tournaments");
      } else {
        toast.error("Failed to delete tournament");
      }
    } catch (error: any) {
      toast.error(error.message || "Error deleting tournament");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading tournament…</span>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">Tournament not found</span>
        </div>
      </div>
    );
  }

  const status = String(tournament.status || "unknown");
  const meta = STATUS_META[status] || STATUS_META.draft;
  const isBlocked = BLOCKED_STATUSES.has(status);
  const title = String(tournament.title || "Untitled");
  const schedule = tournament.schedule as Record<string, unknown> | undefined;
  const organizer = tournament.organizer_id as Record<string, unknown> | undefined;
  const game = tournament.game_id as Record<string, unknown> | undefined;

  const currentCount = Number(tournament.current_count ?? tournament.currentCount ?? 0);
  const maxParticipants = Number(tournament.max_participants ?? tournament.maxParticipants ?? 0);
  const checkedIn = Number(tournament.checked_in_count ?? 0);
  const entryFee = Number(tournament.entry_fee ?? 0);
  const prizePool = Number((tournament.prize_structure as any)?.net_prize_pool ?? tournament.prizePool ?? 0);
  const fundingType = String(tournament.funding_type ?? "free");
  const format = String(tournament.format ?? "Solo");
  const region = String(tournament.region ?? "");

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-orange-500/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[48px_48px]" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <button
              onClick={() => navigate("/admin/tournaments")}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0 mt-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold text-white truncate">{title}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.text} shrink-0`}>
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">
                {String(tournament._id || tournament.id || "")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDeleteTarget(tournament)}
            disabled={isBlocked}
            title={isBlocked ? "Cannot delete active tournaments" : "Delete tournament"}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0 ${
              isBlocked
                ? "text-slate-600 cursor-not-allowed opacity-50"
                : "text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* ── Content Grid ────────────────────────────────────── */}
      <div className="px-6 sm:px-8 space-y-6">
        {/* Tournament Info */}
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white mb-3">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            Tournament Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              icon={Gamepad2}
              label="Game"
              value={game ? String((game as any).name ?? "Unknown") : "Unknown"}
            />
            <StatCard
              icon={User}
              label="Organizer"
              value={organizer ? String((organizer as any).username ?? "Unknown") : "Unknown"}
              subvalue={organizer && (organizer as any).email ? String((organizer as any).email) : undefined}
            />
            <StatCard
              icon={MapPin}
              label="Format & Region"
              value={format}
              subvalue={region ? `📍 ${region}` : undefined}
            />
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white mb-3">
            <Calendar className="w-5 h-5 text-amber-400" />
            Schedule
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              icon={Clock}
              label="Registration Opens"
              value={formatDate(String(schedule?.registration_start ?? ""))}
              subvalue={`Closes: ${formatDate(String(schedule?.registration_end ?? ""))}`}
            />
            <StatCard
              icon={Zap}
              label="Tournament"
              value={formatDate(String(schedule?.tournament_start ?? ""))}
              subvalue={`Ends: ${formatDate(String(schedule?.tournament_end ?? ""))}`}
            />
            {!!(schedule?.check_in_start) && (
              <StatCard
                icon={CheckCircle2}
                label="Check-in"
                value={formatDate(String(schedule?.check_in_start ?? ""))}
                subvalue={`Closes: ${formatDate(String(schedule?.check_in_end ?? ""))}`}
              />
            )}
          </div>
        </div>

        {/* Financials */}
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white mb-3">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Financials
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              icon={DollarSign}
              label="Entry Fee"
              value={formatGhsFromPesewas(entryFee)}
            />
            <StatCard
              icon={Trophy}
              label="Prize Pool"
              value={formatGhsFromPesewas(prizePool)}
            />
            <StatCard
              icon={Lock}
              label="Funding Type"
              value={fundingType.replace(/_/g, " ")}
            />
          </div>
        </div>

        {/* Participation */}
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white mb-3">
            <Users className="w-5 h-5 text-amber-400" />
            Participation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label="Registered"
              value={`${currentCount} / ${maxParticipants}`}
              subvalue={maxParticipants > 0 ? `${Math.round((currentCount / maxParticipants) * 100)}% full` : undefined}
            />
            <StatCard
              icon={CheckCircle2}
              label="Checked In"
              value={String(checkedIn)}
            />
            <StatCard
              icon={Activity}
              label="Status"
              value={status.replace(/_/g, " ")}
            />
            <StatCard
              icon={Lock}
              label="Visibility"
              value={String(tournament.visibility ?? "public")}
            />
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div>
            <h2 className="font-semibold text-white mb-3">Description</h2>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/40">
              <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                {String(tournament.description)}
              </p>
            </div>
          </div>
        )}

        {/* Escrow Status */}
        {fundingType !== "free" && (
          <div>
            <h2 className="font-semibold text-white mb-3">Escrow Status</h2>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/40">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-sm font-semibold text-slate-300">
                    {String(tournament.escrow_status ?? "Not created")}
                  </p>
                </div>
                {!!(tournament.escrow_id) && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                    <p className="text-sm text-slate-400">Escrow ID</p>
                    <p className="text-xs font-mono text-slate-500">
                      {String(tournament.escrow_id).slice(0, 16)}…
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Modal ────────────────────────────────────── */}
      {DeleteModal({
        tournament: deleteTarget,
        onClose: () => setDeleteTarget(null),
        onConfirm: handleConfirmDelete,
        loading: isDeleting,
      })}
    </div>
  );
};

export default TournamentDetail;
