import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { statsService, type PlayerJourney } from "../../services/stats.service";
import { ApexBranding, CardBackground, CardAvatar, CardSponsorRow } from "./CardChrome";

// Run to the Final journey card (spec §4) — every participant gets one.
// 9:16 design size 360×640 → 1080×1920 export (Instagram Stories).

export default function JourneyCardTemplate({
  tournamentId,
  username,
}: {
  tournamentId: string;
  username: string;
}) {
  const [journey, setJourney] = useState<PlayerJourney | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    statsService.getPlayerJourney(tournamentId, username)
      .then((res) => { if (!cancelled) setJourney(res); })
      .catch(() => { if (!cancelled) setJourney(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tournamentId, username]);

  const isChampion = journey?.final_result === "Champion";
  // Journey cards fit ~7 nodes at design size; long league runs get trimmed
  // to the most recent matches with a "+N earlier" note.
  const steps = journey?.steps ?? [];
  const shownSteps = steps.slice(-7);
  const hiddenCount = steps.length - shownSteps.length;

  return (
    <div className="relative w-[360px] h-[640px] bg-slate-950 overflow-hidden flex flex-col p-5">
      <CardBackground />

      {loading ? (
        <div className="relative flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
        </div>
      ) : !journey ? (
        <div className="relative flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">No journey data</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="relative text-center">
            <p className="text-[9px] text-orange-400 font-bold uppercase tracking-[0.2em]">Run to the Final</p>
            <h2 className="font-display text-base font-bold text-white leading-tight mt-1 line-clamp-2">
              {journey.tournament.title}
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {journey.tournament.organizer_name && `Hosted by ${journey.tournament.organizer_name}`}
              {journey.tournament.organizer_name && journey.tournament.date && " · "}
              {journey.tournament.date &&
                new Date(journey.tournament.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Player */}
          <div className="relative flex items-center justify-center gap-3 mt-3">
            <CardAvatar url={journey.avatar_url} fallback={journey.username[0]?.toUpperCase() ?? "?"} size={44} />
            <p className="font-display text-lg font-bold text-white">@{journey.username}</p>
          </div>

          {/* Path */}
          <div className="relative flex-1 mt-4 min-h-0">
            {hiddenCount > 0 && (
              <p className="text-[9px] text-slate-600 text-center mb-1.5">+{hiddenCount} earlier {hiddenCount === 1 ? "match" : "matches"}</p>
            )}
            <div className="space-y-1.5">
              {shownSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* Path connector dot */}
                  <div className="flex flex-col items-center self-stretch w-3 shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-3 ${
                      step.outcome === "win" ? "bg-emerald-400" : step.outcome === "draw" ? "bg-amber-400" : "bg-red-400"
                    }`} />
                    {i < shownSteps.length - 1 && <div className="w-px flex-1 bg-slate-800" />}
                  </div>
                  <div className={`flex-1 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                    step.outcome === "win"
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : step.outcome === "draw"
                        ? "border-amber-500/25 bg-amber-500/5"
                        : "border-red-500/25 bg-red-500/5"
                  }`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                      {step.opponent.avatar_url ? (
                        <img src={step.opponent.avatar_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <span className="text-[8px] font-bold text-slate-400">
                          {(step.opponent.username?.[0] ?? "?").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] text-slate-500 uppercase tracking-wider leading-none">{step.round_label}</p>
                      <p className="text-[11px] text-white truncate leading-tight mt-0.5">
                        vs {step.opponent.username ?? "Unknown"}
                      </p>
                    </div>
                    {step.clean_sheet && <span className="text-[9px] shrink-0" title="Clean sheet">🧤</span>}
                    <span className={`font-display text-sm font-bold shrink-0 ${
                      step.outcome === "win" ? "text-emerald-300" : step.outcome === "draw" ? "text-amber-300" : "text-red-300"
                    }`}>
                      {step.my_score}–{step.opponent_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final result banner */}
          <div className={`relative rounded-xl border px-4 py-3 text-center mt-3 ${
            isChampion
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-slate-700 bg-slate-900/70"
          }`}>
            <p className={`font-display text-lg font-bold ${isChampion ? "text-amber-300" : "text-white"}`}>
              {isChampion && "🏆 "}{journey.final_result}
            </p>
          </div>

          <div className="relative mt-3 space-y-1.5">
            <CardSponsorRow sponsors={journey.tournament.sponsors} />
            <ApexBranding />
          </div>
        </>
      )}
    </div>
  );
}
