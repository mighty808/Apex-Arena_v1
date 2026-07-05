import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { hypeService, type HypeCounts, type HypeReaction } from "../services/community.service";
import { showError } from "../utils/toast.utils";

// Live match hype (spec §6.3): spectators & players tap a reaction to back a
// player. Tapping the same reaction again removes it; a different one
// switches. The leader gets the Crowd Favourite crown, which also appears in
// the post-match view since counts persist.

const REACTIONS: { id: HypeReaction; emoji: string }[] = [
  { id: "fire", emoji: "🔥" },
  { id: "clap", emoji: "👏" },
  { id: "heart", emoji: "❤️" },
  { id: "goat", emoji: "🐐" },
];

export default function HypePanel({
  matchId,
  players,
}: {
  matchId: string;
  players: { id: string; name: string }[];
}) {
  const [counts, setCounts] = useState<HypeCounts | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hypeService.getCounts(matchId)
      .then((res) => { if (!cancelled) setCounts(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [matchId]);

  const react = async (targetUserId: string, reaction: HypeReaction) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await hypeService.react(matchId, targetUserId, reaction);
      if (res) setCounts(res);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to react.");
    } finally {
      setBusy(false);
    }
  };

  const countFor = (playerId: string) =>
    counts?.totals.find((t) => t.target_user_id === playerId)?.count ?? 0;

  const validPlayers = players.filter((p) => p.id);
  if (validPlayers.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2.5 text-center">
        Crowd Hype
      </p>
      <div className={`grid gap-3 ${validPlayers.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {validPlayers.map((player) => {
          const isFavourite = counts?.crowd_favourite === player.id && (counts?.total ?? 0) > 0;
          return (
            <div key={player.id} className="text-center">
              <p className="text-[11px] font-semibold text-slate-300 truncate flex items-center justify-center gap-1">
                {isFavourite && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                {player.name}
                <span className="text-slate-500 font-normal">· {countFor(player.id)}</span>
              </p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                {REACTIONS.map(({ id, emoji }) => {
                  const isMine =
                    counts?.viewer_reaction?.target_user_id === player.id &&
                    counts?.viewer_reaction?.reaction === id;
                  return (
                    <button
                      key={id}
                      onClick={() => void react(player.id, id)}
                      disabled={busy}
                      title={isMine ? "Tap again to remove" : `Send ${emoji} to ${player.name}`}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all disabled:opacity-50 ${
                        isMine
                          ? "bg-amber-500/20 border border-amber-500/50 scale-110"
                          : "bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/40 hover:bg-slate-800"
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {isFavouriteLabel(counts, validPlayers)}
    </div>
  );
}

function isFavouriteLabel(counts: HypeCounts | null, players: { id: string; name: string }[]) {
  if (!counts?.crowd_favourite || counts.total === 0) return null;
  const name = players.find((p) => p.id === counts.crowd_favourite)?.name;
  if (!name) return null;
  return (
    <p className="text-[10px] text-amber-400/90 text-center mt-2.5">
      👑 Crowd favourite: <span className="font-semibold">{name}</span>
    </p>
  );
}
