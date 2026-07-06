import { useEffect, useState } from "react";
import { BarChart3, Loader2, Shield, ShieldCheck, Swords, Target } from "lucide-react";
import { statsService, type TournamentStats, type TournamentStatRow } from "../../services/stats.service";

// Per-tournament stats panel (spec §3.1), visible to participants and
// spectators, during and after the tournament. Aggregated server-side from
// the tournament's completed matches.

function StatList({
  icon: Icon,
  title,
  rows,
  valueOf,
  unit,
}: {
  icon: React.ElementType;
  title: string;
  rows: TournamentStatRow[];
  valueOf: (r: TournamentStatRow) => number | undefined;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-orange-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-600">No data yet</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.user_id} className="flex items-center gap-2.5">
              <span className={`w-5 text-xs font-bold ${i === 0 ? "text-amber-400" : "text-slate-600"}`}>
                {i + 1}.
              </span>
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-slate-400">
                    {(r.username?.[0] ?? "?").toUpperCase()}
                  </span>
                )}
              </div>
              <span className="flex-1 text-sm text-white truncate">{r.username ?? "Unknown"}</span>
              <span className="text-sm font-bold text-orange-300">
                {valueOf(r) ?? 0} <span className="text-[10px] text-slate-500 font-normal">{unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TournamentStatsPanel({ tournamentId }: { tournamentId: string }) {
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;
    let cancelled = false;
    setLoading(true);
    statsService.getTournamentStats(tournamentId)
      .then((res) => { if (!cancelled) setStats(res); })
      .catch(() => { if (!cancelled) setStats(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!stats || stats.completed_matches === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-8 h-8 text-slate-700 mx-auto" />
        <p className="text-sm text-slate-500 mt-3">
          Tournament stats appear here once matches are completed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatList icon={Target} title="Top Scorer" rows={stats.top_scorers} valueOf={(r) => r.goals} unit="goals" />
        <StatList icon={ShieldCheck} title="Most Clean Sheets" rows={stats.most_clean_sheets} valueOf={(r) => r.clean_sheets} unit="CS" />
        <StatList icon={Shield} title="Best Defence" rows={stats.best_defence} valueOf={(r) => r.goals_conceded} unit="conceded" />
        <StatList icon={Swords} title="Most Matches" rows={stats.most_matches} valueOf={(r) => r.matches} unit="played" />
      </div>
      <p className="text-[11px] text-slate-600 mt-3 text-right">
        Based on {stats.completed_matches} completed {stats.completed_matches === 1 ? "match" : "matches"}
      </p>
    </div>
  );
}
