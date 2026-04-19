import { CalendarDays, ExternalLink, Gamepad2 } from "lucide-react";
import { type MyTournamentRegistration } from "../../services/tournament.service";
import { REGISTRATION_STATUS_COLORS, STATUS_COLORS, formatDate } from "./utils";

interface RegistrationCardProps {
  registration: MyTournamentRegistration;
  canWithdraw: boolean;
  isWithdrawing: boolean;
  onRequestWithdraw: (registration: MyTournamentRegistration) => void;
  onOpenDetails: (tournamentId: string) => void;
}

// Accent strip same mapping as TournamentCard
const STATUS_ACCENT: Record<string, string> = {
  open: "from-green-500 to-emerald-600",
  published: "from-cyan-500 to-blue-600",
  started: "from-blue-500 to-indigo-600",
  ongoing: "from-blue-500 to-indigo-600",
  locked: "from-amber-500 to-orange-600",
  awaiting_deposit: "from-amber-500 to-orange-600",
  completed: "from-slate-500 to-slate-600",
  cancelled: "from-red-500 to-red-600",
  draft: "from-slate-600 to-slate-700",
};

export function RegistrationCard({
  registration,
  canWithdraw,
  isWithdrawing,
  onRequestWithdraw,
  onOpenDetails,
}: RegistrationCardProps) {
  const tournamentStatusColor =
    STATUS_COLORS[registration.tournamentStatus] ??
    "bg-slate-700/60 text-slate-300";
  const registrationStatusColor =
    REGISTRATION_STATUS_COLORS[registration.status] ??
    "bg-slate-700/60 text-slate-300";
  const accentGradient =
    STATUS_ACCENT[registration.tournamentStatus] ?? "from-slate-500 to-slate-600";

  return (
    <div
      className="group rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col overflow-hidden hover:border-slate-600 hover:shadow-lg hover:shadow-black/40 transition-all cursor-pointer"
      onClick={() => onOpenDetails(registration.tournamentId)}
    >
      {/* Accent strip */}
      <div className={`h-1 w-full bg-linear-to-r ${accentGradient}`} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Game + registration status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Gamepad2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400 truncate">
              {registration.tournamentGameName ?? "Game"}
            </span>
          </div>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap shrink-0 ${registrationStatusColor}`}
          >
            {registration.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-cyan-100 transition-colors">
          {registration.tournamentTitle}
        </h3>

        {/* Tournament status + dates */}
        <div className="space-y-1.5">
          <span
            className={`inline-flex text-[11px] px-2 py-0.5 rounded-full capitalize ${tournamentStatusColor}`}
          >
            {registration.tournamentStatus.replace(/_/g, " ")}
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3 shrink-0" />
              Starts {formatDate(registration.tournamentStart)}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3 shrink-0" />
              Joined {formatDate(registration.registeredAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(registration.tournamentId);
            }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Details
          </button>
          {canWithdraw && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestWithdraw(registration);
              }}
              disabled={isWithdrawing}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              {isWithdrawing ? "Withdrawing…" : "Withdraw"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
