import { useEffect, useState } from "react";
import { statsService, type TournamentStats, type MatchHighlight } from "../../services/stats.service";
import { ApexBranding, CardBackground, CardAvatar, CardSponsorRow } from "./CardChrome";

// Tournament summary card (spec §3.3): winner, golden boot, clean sheet
// award, highest-scoring match, most one-sided result. Organizer name +
// Apex branding; sponsor logo slots arrive with Phase 4.
// Square 360×360 design size → 1080×1080 export.

function HighlightLine({ label, highlight }: { label: string; highlight?: MatchHighlight | null }) {
  if (!highlight) return null;
  const [a, b] = highlight.sides;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
      <span className="text-[9px] text-slate-500 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-[11px] text-white truncate">
        {a?.username ?? "?"} <span className="font-bold text-orange-300">{a?.score}–{b?.score}</span> {b?.username ?? "?"}
      </span>
    </div>
  );
}

export default function TournamentSummaryTemplate({
  tournamentId,
  tournamentTitle,
  organizerName,
  date,
}: {
  tournamentId: string;
  tournamentTitle: string;
  organizerName?: string;
  date?: string;
}) {
  const [stats, setStats] = useState<TournamentStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    statsService.getTournamentStats(tournamentId)
      .then((res) => { if (!cancelled) setStats(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tournamentId]);

  const topScorer = stats?.top_scorers?.[0];
  const cleanSheets = stats?.most_clean_sheets?.[0];

  return (
    <div className="relative w-[360px] h-[360px] bg-slate-950 overflow-hidden flex flex-col p-5">
      <CardBackground />

      {/* Header */}
      <div className="relative text-center">
        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-[0.2em]">Tournament Recap</p>
        <h2 className="font-display text-lg font-bold text-white leading-tight mt-1 line-clamp-2">{tournamentTitle}</h2>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {organizerName && `Hosted by ${organizerName}`}
          {organizerName && date && " · "}
          {date && new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Champion */}
      <div className="relative flex items-center justify-center gap-3 mt-3">
        <CardAvatar
          url={stats?.champion?.avatar_url}
          fallback={stats?.champion?.username?.[0]?.toUpperCase() ?? "🏆"}
          size={48}
        />
        <div>
          <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">🥇 Champion</p>
          <p className="font-display text-base font-bold text-white leading-tight">
            {stats?.champion?.username ?? "TBD"}
          </p>
        </div>
      </div>

      {/* Awards + highlights */}
      <div className="relative space-y-1.5 mt-3 flex-1">
        {topScorer && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider shrink-0">⚽ Golden Boot</span>
            <span className="text-[11px] text-white truncate">
              {topScorer.username ?? "?"} <span className="font-bold text-orange-300">{topScorer.goals} goals</span>
            </span>
          </div>
        )}
        {cleanSheets && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider shrink-0">☑️ Clean Sheets</span>
            <span className="text-[11px] text-white truncate">
              {cleanSheets.username ?? "?"} <span className="font-bold text-orange-300">{cleanSheets.clean_sheets} CS</span>
            </span>
          </div>
        )}
        <HighlightLine label="🔥 Thriller" highlight={stats?.highest_scoring_match} />
        <HighlightLine label="💥 One-Sided" highlight={stats?.most_one_sided} />
      </div>

      <div className="relative mt-2 space-y-1.5">
        <CardSponsorRow sponsors={stats?.sponsors} />
        <ApexBranding />
      </div>
    </div>
  );
}
