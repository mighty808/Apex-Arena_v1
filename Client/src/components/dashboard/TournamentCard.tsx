import { CalendarDays, Gamepad2 } from "lucide-react";
import type { TournamentRegistration } from "../../services/dashboard.service";
import TournamentImage from "./TournamentImage";

type TournamentCardProps = {
  reg: TournamentRegistration;
};

export default function TournamentCard({ reg }: TournamentCardProps) {
  const statusColors: Record<string, string> = {
    registered: "bg-cyan-500/20 text-cyan-300",
    checked_in: "bg-green-500/20 text-green-300",
    pending_payment: "bg-amber-500/20 text-amber-300",
    disqualified: "bg-red-500/20 text-red-300",
    withdrawn: "bg-slate-500/20 text-slate-400",
    cancelled: "bg-slate-500/20 text-slate-400",
  };

  const statusLabel = reg.status.replace(/_/g, " ");
  const dateStr = reg.tournamentSchedule.startDate
    ? new Date(reg.tournamentSchedule.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBD";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <TournamentImage reg={reg} className="w-12 h-12 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {reg.tournamentTitle}
            </h4>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5" />
                {reg.gameName ?? reg.registrationType}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${
            statusColors[reg.status] ?? "bg-slate-700 text-slate-300"
          }`}
        >
          {statusLabel}
        </span>
      </div>
      {reg.finalPlacement && (
        <p className="text-xs text-cyan-300">
          Placed #{reg.finalPlacement}
          {reg.prizeWon ? ` - Won $${reg.prizeWon.toLocaleString()}` : ""}
        </p>
      )}
    </div>
  );
}
