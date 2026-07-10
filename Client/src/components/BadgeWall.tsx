import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { statsService, type PlayerBadgeItem } from "../services/stats.service";

// Badge display (spec §2.2) shared by the Profile Badges tab, the Overview
// strip, and the public player page. Earned badges render in colour with
// counts; unearned ones stay locked/grey. Badges are game-specific, the
// same badge earned in two games shows both game names.

export const BADGE_CATALOGUE = [
  { type: "tournament_winner", emoji: "🥇", name: "Tournament Winner", desc: "Win a tournament", category: "Tournament" },
  { type: "back_to_back",      emoji: "🏆", name: "Back to Back",      desc: "Win two or more consecutive tournaments", category: "Tournament" },
  { type: "clean_sheet_king",  emoji: "☑️", name: "Clean Sheet King",  desc: "Most clean sheets in a single tournament", category: "Defensive" },
  { type: "unbreakable",       emoji: "🔒", name: "Unbreakable",       desc: "Longest clean sheet streak on the platform", category: "Defensive" },
  { type: "golden_boot",       emoji: "⚽", name: "Golden Boot",       desc: "Top scorer in a single tournament", category: "Scoring" },
  { type: "elite",             emoji: "👑", name: "Elite",             desc: "Top scorer across a full season (coming with seasons)", category: "Scoring" },
  { type: "consistent",        emoji: "🎯", name: "Consistent",        desc: "Podium finishes in consecutive tournaments", category: "Participation" },
  { type: "veteran",           emoji: "💎", name: "Veteran",           desc: "Compete in many tournaments across the platform", category: "Participation" },
] as const;

interface EarnedInfo {
  count: number;
  games: string[];
  latest: PlayerBadgeItem;
}

function groupEarned(badges: PlayerBadgeItem[]): Map<string, EarnedInfo> {
  const map = new Map<string, EarnedInfo>();
  for (const b of badges) {
    const info = map.get(b.badge_type);
    if (info) {
      info.count += 1;
      const g = b.game?.name;
      if (g && !info.games.includes(g)) info.games.push(g);
    } else {
      map.set(b.badge_type, { count: 1, games: b.game?.name ? [b.game.name] : [], latest: b });
    }
  }
  return map;
}

export default function BadgeWall({
  username,
  variant = "wall",
}: {
  username: string;
  variant?: "wall" | "strip";
}) {
  const [badges, setBadges] = useState<PlayerBadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    statsService.getPlayerBadges(username)
      .then((res) => { if (!cancelled) setBadges(res); })
      .catch(() => { if (!cancelled) setBadges([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  const earned = useMemo(() => groupEarned(badges), [badges]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  // ── Strip: earned badges only, compact, hidden entirely when none ──
  if (variant === "strip") {
    if (earned.size === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {BADGE_CATALOGUE.filter((b) => earned.has(b.type)).map((b) => {
          const info = earned.get(b.type)!;
          return (
            <span
              key={b.type}
              title={`${b.name}${info.games.length ? `, ${info.games.join(", ")}` : ""}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-sm"
            >
              <span>{b.emoji}</span>
              <span className="text-amber-200 font-medium">{b.name}</span>
              {info.count > 1 && <span className="text-xs text-amber-400 font-bold">×{info.count}</span>}
            </span>
          );
        })}
      </div>
    );
  }

  // ── Wall: full catalogue, earned lit / unearned locked ──
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {BADGE_CATALOGUE.map((badge) => {
          const info = earned.get(badge.type);
          const isEarned = Boolean(info);
          return (
            <div
              key={badge.type}
              className={`relative rounded-xl border p-4 text-center transition-colors ${
                isEarned
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-slate-800 bg-slate-950/40 opacity-60"
              }`}
            >
              {!isEarned && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                </div>
              )}
              {isEarned && info!.count > 1 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                  ×{info!.count}
                </span>
              )}
              <p className={`text-3xl ${isEarned ? "" : "grayscale"}`}>{badge.emoji}</p>
              <p className={`text-sm font-semibold mt-2 ${isEarned ? "text-amber-200" : "text-white"}`}>
                {badge.name}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{badge.desc}</p>
              {isEarned && info!.games.length > 0 && (
                <p className="text-[10px] text-amber-400/80 mt-1.5">{info!.games.join(" · ")}</p>
              )}
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 uppercase tracking-wide">
                {badge.category}
              </span>
            </div>
          );
        })}
      </div>
      {earned.size === 0 && (
        <p className="text-xs text-slate-500 mt-4 text-center">
          Badges unlock automatically as you compete, win tournaments, keep clean sheets, and stay consistent.
        </p>
      )}
    </div>
  );
}
