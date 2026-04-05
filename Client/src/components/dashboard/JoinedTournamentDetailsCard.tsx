import { Link } from "react-router-dom";
import type { TournamentRegistration } from "../../services/dashboard.service";
import TournamentImage from "./TournamentImage";

type JoinedTournamentDetailsCardProps = {
  reg: TournamentRegistration;
};

function formatTournamentDate(value?: string) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JoinedTournamentDetailsCard({
  reg,
}: JoinedTournamentDetailsCardProps) {
  const registrationStatusColors: Record<string, string> = {
    registered: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    checked_in: "bg-green-500/20 text-green-300 border-green-500/30",
    pending_payment: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    disqualified: "bg-red-500/20 text-red-300 border-red-500/30",
    withdrawn: "bg-slate-500/20 text-slate-400 border-slate-600/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-600/30",
  };

  const tournamentStatusColors: Record<string, string> = {
    draft: "bg-slate-600/20 text-slate-300 border-slate-600/30",
    awaiting_deposit: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    published: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    ongoing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    awaiting_results: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    verifying_results: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-600/30",
  };

  const registrationStatus = reg.status.replace(/_/g, " ");
  const tournamentStatus = reg.tournamentStatus
    ? reg.tournamentStatus.replace(/_/g, " ")
    : "Unknown";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <TournamentImage reg={reg} className="w-12 h-12 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {reg.tournamentTitle}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Joined {formatTournamentDate(reg.createdAt)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {reg.gameName ?? "Game not set"}
            </p>
          </div>
        </div>
        <Link
          to={`/auth/tournaments/${reg.tournamentId}`}
          className="text-xs px-2.5 py-1 rounded-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-colors whitespace-nowrap"
        >
          View Details
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full capitalize border ${
            registrationStatusColors[reg.status] ??
            "bg-slate-700 text-slate-300 border-slate-600"
          }`}
        >
          Registration: {registrationStatus}
        </span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full capitalize border ${
            tournamentStatusColors[reg.tournamentStatus] ??
            "bg-slate-700 text-slate-300 border-slate-600"
          }`}
        >
          Tournament: {tournamentStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="text-slate-400">Start Date</div>
        <div className="text-slate-200 text-right">
          {formatTournamentDate(reg.tournamentSchedule.startDate)}
        </div>

        <div className="text-slate-400">Check-In</div>
        <div className="text-slate-200 text-right">
          {formatTournamentDate(reg.tournamentSchedule.checkInStart)}
        </div>

        <div className="text-slate-400">Entry Type</div>
        <div className="text-slate-200 text-right capitalize">
          {reg.registrationType}
        </div>

        <div className="text-slate-400">In-Game ID</div>
        <div
          className="text-slate-200 text-right truncate"
          title={reg.inGameId || "Not set"}
        >
          {reg.inGameId || "Not set"}
        </div>

        {reg.teamName ? (
          <>
            <div className="text-slate-400">Team Name</div>
            <div
              className="text-slate-200 text-right truncate"
              title={reg.teamName}
            >
              {reg.teamName}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
