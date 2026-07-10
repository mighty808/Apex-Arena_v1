import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Swords } from "lucide-react";
import PlayerSearch from "./PlayerSearch";
import { statsService, type HeadToHead } from "../services/stats.service";

// Head-to-head records (spec §1.1): search any opponent, see your full
// record against them across every completed match on the platform.

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function HeadToHeadPanel({ username }: { username: string }) {
  const [data, setData] = useState<HeadToHead | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookUp = (opponent: string) => {
    if (!opponent || opponent.toLowerCase() === username.toLowerCase()) return;
    setLoading(true);
    setSearched(true);
    statsService.getHeadToHead(username, opponent)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div className="max-w-sm">
        <PlayerSearch
          placeholder="Search an opponent…"
          onSelect={(p) => lookUp(p.username)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        </div>
      ) : !searched ? (
        <div className="text-center py-10">
          <Swords className="w-10 h-10 text-slate-700 mx-auto" />
          <p className="text-sm text-slate-400 mt-4 font-medium">Pick an opponent to compare</p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            Your full record against them across every completed match on the platform.
          </p>
        </div>
      ) : !data ? (
        <p className="text-sm text-slate-500 text-center py-10">Could not load that record. Try another player.</p>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Header: the two players */}
          <div className="flex items-center justify-center gap-4">
            <span className="font-display text-base font-bold text-white">@{data.player.username}</span>
            <span className="text-xs text-slate-600 font-bold uppercase">vs</span>
            <Link
              to={`/players/${encodeURIComponent(data.opponent.username)}`}
              className="font-display text-base font-bold text-orange-300 hover:text-orange-200"
            >
              @{data.opponent.username}
            </Link>
          </div>

          {data.summary.played === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              You two haven't played each other yet.
            </p>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: "Played", value: data.summary.played, color: "text-white" },
                  { label: "Wins", value: data.summary.wins, color: "text-emerald-300" },
                  { label: "Draws", value: data.summary.draws, color: "text-amber-300" },
                  { label: "Losses", value: data.summary.losses, color: "text-red-300" },
                  { label: "Goals For", value: data.summary.goals_for, color: "text-orange-300" },
                  { label: "Goals Against", value: data.summary.goals_against, color: "text-slate-300" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-950/40 px-2 py-3 text-center">
                    <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wide leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent meetings */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent meetings</p>
                <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/30">
                  {data.matches.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        m.outcome === "win" ? "bg-emerald-400" : m.outcome === "draw" ? "bg-amber-400" : "bg-red-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{m.tournament_title ?? "Tournament"}</p>
                        <p className="text-[10px] text-slate-500">{m.round_label}{m.date ? ` · ${fmtDate(m.date)}` : ""}</p>
                      </div>
                      <span className={`font-display text-sm font-bold shrink-0 ${
                        m.outcome === "win" ? "text-emerald-300" : m.outcome === "draw" ? "text-amber-300" : "text-red-300"
                      }`}>
                        {m.my_score}-{m.opponent_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
