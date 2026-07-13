import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { statsService, type CareerStatLine, type PlayerBadgeItem } from "../../services/stats.service";
import { BADGE_CATALOGUE } from "../BadgeWall";
import { ApexBranding, CardBackground, CardAvatar } from "./CardChrome";

// Shareable player identity card (spec §1 "searchable as an image card",
// §2.2 "badges appear on shareable player cards"). Square 360×360 design
// size → 1080×1080 export. The QR encodes the public profile URL so anyone
// scanning a shared card lands straight on the player's Apex profile.

export function publicProfileUrl(username: string): string {
  return `https://apex-arenas.com/players/${encodeURIComponent(username)}`;
}

export default function PlayerCardTemplate({
  username,
  displayName,
  avatarUrl,
  role,
}: {
  username: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
}) {
  const [totals, setTotals] = useState<CareerStatLine | null>(null);
  const [badges, setBadges] = useState<PlayerBadgeItem[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    statsService.getPlayerCareerStats(username)
      .then((res) => { if (!cancelled && res) setTotals(res.totals); })
      .catch(() => {});
    statsService.getPlayerBadges(username)
      .then((res) => { if (!cancelled) setBadges(res); })
      .catch(() => {});
    QRCode.toDataURL(publicProfileUrl(username), {
      width: 240,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [username]);

  const earnedTypes = [...new Set(badges.map((b) => b.badge_type))];
  const badgeEmojis = BADGE_CATALOGUE.filter((b) => earnedTypes.includes(b.type)).slice(0, 6);

  const stats = [
    { label: "Wins", value: totals?.tournament_wins ?? 0 },
    { label: "Podiums", value: totals?.podium_finishes ?? 0 },
    { label: "Goals", value: totals?.goals_for ?? 0 },
    { label: "Clean Sheets", value: totals?.clean_sheets ?? 0 },
    { label: "Matches", value: totals?.matches_played ?? 0 },
    { label: "Win Rate", value: `${totals?.win_rate ?? 0}%` },
  ];

  return (
    <div className="relative w-[360px] h-[360px] bg-slate-950 overflow-hidden flex flex-col p-5">
      <CardBackground />

      {/* Identity + scannable profile QR */}
      <div className="relative flex items-center gap-3.5">
        <CardAvatar url={avatarUrl} fallback={displayName[0]?.toUpperCase() ?? "?"} size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold text-white leading-tight truncate">{displayName}</p>
          <p className="text-sm text-slate-400 truncate">@{username}</p>
          {role && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[9px] font-bold text-orange-300 uppercase tracking-wide">
              {role}
            </span>
          )}
        </div>
        {qrDataUrl && (
          <div className="shrink-0 text-center">
            <div className="w-[60px] h-[60px] rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5">
              <img src={qrDataUrl} alt="" className="w-full h-full" />
            </div>
            <p className="text-[7px] text-slate-500 mt-1 uppercase tracking-wider">Scan me</p>
          </div>
        )}
      </div>

      {/* Badges */}
      {badgeEmojis.length > 0 && (
        <div className="relative flex gap-1.5 mt-4">
          {badgeEmojis.map((b) => (
            <span
              key={b.type}
              className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-base"
            >
              {b.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="relative grid grid-cols-3 gap-2 mt-4 flex-1 content-center">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/70 px-2 py-2.5 text-center">
            <p className="font-display text-lg font-bold text-orange-300 leading-none">{s.value}</p>
            <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-3">
        <ApexBranding />
      </div>
    </div>
  );
}
