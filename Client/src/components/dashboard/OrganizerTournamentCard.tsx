import { CalendarDays } from "lucide-react";
import type { Tournament as OrganizerTournament } from "../../services/organizer.service";

type OrganizerTournamentCardProps = {
  tournament: OrganizerTournament;
};

export default function OrganizerTournamentCard({
  tournament,
}: OrganizerTournamentCardProps) {
  const statusColors: Record<string, string> = {
    draft: "bg-slate-600/20 text-slate-300",
    awaiting_deposit: "bg-amber-500/20 text-amber-300",
    published: "bg-cyan-500/20 text-cyan-300",
    open: "bg-green-500/20 text-green-300",
    completed: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
  };

  const startDate = tournament.schedule.tournamentStart
    ? new Date(tournament.schedule.tournamentStart).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )
    : "TBD";

  const fillPercent =
    tournament.maxParticipants > 0
      ? Math.min(
          100,
          Math.round(
            (tournament.currentCount / tournament.maxParticipants) * 100,
          ),
        )
      : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {tournament.title}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {tournament.game?.name ?? "Unknown Game"} -{" "}
            {tournament.format ?? "Solo"}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${
            statusColors[tournament.status] ?? "bg-slate-700 text-slate-300"
          }`}
        >
          {tournament.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {startDate}
        </span>
        <span>
          {tournament.currentCount}/{tournament.maxParticipants} slots
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-cyan-400 to-emerald-400"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}
