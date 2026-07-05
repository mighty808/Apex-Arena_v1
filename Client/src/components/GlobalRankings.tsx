import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Loader2, ShieldCheck, Target, Medal } from "lucide-react";
import { statsService, type LeaderboardEntry, type LeaderboardMetric } from "../services/stats.service";

// Platform-wide leaderboards (spec §6.4) — all-time top scorers, most
// tournament wins, longest clean-sheet streak, most podium finishes.
// Backed by the Phase 1 stats engine; usernames link to public profiles.

const METRICS: { id: LeaderboardMetric; label: string; icon: React.ElementType; unit: string }[] = [
  { id: "goals", label: "Top Scorers", icon: Target, unit: "goals" },
  { id: "tournament_wins", label: "Most Wins", icon: Crown, unit: "wins" },
  { id: "clean_sheet_streak", label: "Clean Sheet Streak", icon: ShieldCheck, unit: "streak" },
  { id: "podiums", label: "Most Podiums", icon: Medal, unit: "podiums" },
];

export default function GlobalRankings({ gameId }: { gameId?: string }) {
  const [metric, setMetric] = useState<LeaderboardMetric>("goals");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    statsService.getLeaderboard({ metric, gameId: gameId === "all" ? undefined : gameId, limit: 10 })
      .then((res) => { if (!cancelled) setEntries(res?.entries ?? []); })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [metric, gameId]);

  const activeMetric = METRICS.find((m) => m.id === metric)!;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="font-display text-base font-bold text-white">Global Rankings</h2>
        <p className="text-xs text-slate-500 mt-0.5">All-time platform records across every tournament</p>
      </div>

      {/* Metric tabs */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
          {METRICS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMetric(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                metric === id ? "bg-orange-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No records yet — rankings build up as matches are completed.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {entries.map((e) => (
              <div key={`${e.user_id}-${e.game?.id ?? "all"}`} className="flex items-center gap-3 py-2.5">
                <span className={`w-7 text-sm font-bold tabular-nums ${
                  e.rank === 1 ? "text-amber-400" : e.rank === 2 ? "text-slate-300" : e.rank === 3 ? "text-orange-400" : "text-slate-600"
                }`}>
                  #{e.rank}
                </span>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                  {e.avatar_url ? (
                    <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      {(e.username?.[0] ?? "?").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/players/${encodeURIComponent(e.username)}`} className="text-sm text-white font-medium truncate hover:text-orange-300 transition-colors">
                    {e.username}
                  </Link>
                  {e.game && <p className="text-[10px] text-slate-500">{e.game.name}</p>}
                </div>
                <span className="text-sm font-bold text-orange-300">
                  {e.value} <span className="text-[10px] text-slate-500 font-normal">{activeMetric.unit}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
