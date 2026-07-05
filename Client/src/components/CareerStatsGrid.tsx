import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { statsService, type CareerStatLine, type PlayerCareerStats } from "../services/stats.service";

// Career stats grid (spec §1.3) shared by the auth Profile Overview tab and
// the public /players/:username page. Fetches from the stats engine and
// offers an all-games / per-game filter.

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-4 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide leading-tight">{label}</p>
    </div>
  );
}

export default function CareerStatsGrid({ username }: { username: string }) {
  const [data, setData] = useState<PlayerCareerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState<string>("all");

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    statsService.getPlayerCareerStats(username)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  const line: CareerStatLine | null = useMemo(() => {
    if (!data) return null;
    if (gameFilter === "all") return data.totals;
    return data.per_game.find((l) => l.game?.id === gameFilter) ?? data.totals;
  }, [data, gameFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!data || !line || line.matches_played + line.tournaments_played === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-slate-500">
          No stats yet — they'll accumulate automatically from verified match results.
        </p>
      </div>
    );
  }

  const gamesWithStats = data.per_game.filter((l) => l.game);

  return (
    <div>
      {gamesWithStats.length > 1 && (
        <div className="mb-4">
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/70 appearance-none cursor-pointer [&>option]:bg-slate-800"
          >
            <option value="all">All Games</option>
            {gamesWithStats.map((l) => (
              <option key={l.game!.id} value={l.game!.id}>{l.game!.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCell label="Goals Scored" value={line.goals_for} />
        <StatCell label="Clean Sheets" value={line.clean_sheets} />
        <StatCell label="Tournament Wins" value={line.tournament_wins} />
        <StatCell label="Podium Finishes" value={line.podium_finishes} />
        <StatCell label="Win Rate" value={`${line.win_rate}%`} />
        <StatCell label="Matches Played" value={line.matches_played} />
        <StatCell label="Matches Won" value={line.matches_won} />
        <StatCell label="Goals Conceded" value={line.goals_against} />
        <StatCell label="Avg Goals / Match" value={line.avg_goals_per_match} />
        <StatCell label="Best Win Streak" value={line.best_win_streak} />
      </div>
    </div>
  );
}
