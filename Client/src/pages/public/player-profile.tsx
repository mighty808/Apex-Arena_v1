import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Award, Gamepad2, Globe, Loader2, Trophy, UserX } from "lucide-react";
import { apiGet } from "../../utils/api.utils";
import { AUTH_ENDPOINTS } from "../../config/api.config";
import CareerStatsGrid from "../../components/CareerStatsGrid";
import BadgeWall from "../../components/BadgeWall";

// Public player profile — spec §1: "public-facing profile page that serves as
// their identity on the platform". Read-only twin of the auth Profile page.
// Career stats/badges render as placeholders until the stats engine lands
// (new_build.md Phase 1–2).

interface PublicProfile {
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string;
  country: string;
  socialLinks: Record<string, string>;
  gameProfiles: { gameName: string; skillLevel: string; rank?: string }[];
  memberSince?: string;
}

function mapProfile(raw: Record<string, unknown>): PublicProfile {
  const profile = (raw.profile ?? {}) as Record<string, unknown>;
  const games = (raw.game_profiles ?? []) as Record<string, unknown>[];
  return {
    username: String(raw.username ?? ""),
    role: String(raw.role ?? "player"),
    firstName: String(profile.first_name ?? ""),
    lastName: String(profile.last_name ?? ""),
    bio: String(profile.bio ?? ""),
    avatarUrl: String(profile.avatar_url ?? ""),
    country: String(profile.country ?? ""),
    socialLinks: (profile.social_links ?? {}) as Record<string, string>,
    gameProfiles: games.map((g) => {
      const game = (g.game ?? {}) as Record<string, unknown>;
      return {
        gameName: String(game.name ?? "Unknown Game"),
        skillLevel: String(g.skill_level ?? "beginner"),
        rank: g.rank ? String(g.rank) : undefined,
      };
    }),
    memberSince: raw.member_since ? String(raw.member_since) : undefined,
  };
}

export default function PublicPlayerProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    apiGet(`${AUTH_ENDPOINTS.PUBLIC_PROFILE}/${encodeURIComponent(username)}`, { skipAuth: true })
      .then((res) => {
        if (cancelled) return;
        if (res.success) setProfile(mapProfile(res.data as Record<string, unknown>));
        else setNotFound(true);
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <UserX className="w-12 h-12 text-slate-700" />
        <h1 className="font-display text-xl font-bold text-white mt-4">Player not found</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          No player with the username "@{username}" exists, or the account is inactive.
        </p>
        <Link to="/" className="mt-5 px-4 py-2 rounded-xl bg-orange-500 text-slate-950 text-sm font-bold hover:bg-orange-400 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || profile.username;
  const initials = (profile.firstName[0] ?? "").toUpperCase() + (profile.lastName[0] ?? "").toUpperCase()
    || profile.username[0]?.toUpperCase() || "?";
  const socialEntries = Object.entries(profile.socialLinks).filter(([, v]) => Boolean(v));

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-slate-800/50">
        <div className="relative h-28 sm:h-36 bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 120% at 80% -10%, rgba(249,115,22,0.35), transparent)" }} />
          <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-orange-500/30 to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left gap-4 -mt-12 sm:-mt-14 pb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-slate-950 shadow-2xl ring-2 ring-orange-500/30 bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-bold text-white">{initials}</span>
              )}
            </div>
            <div className="min-w-0 sm:pb-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">{displayName}</h1>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap sm:justify-start">
                <span className="text-slate-400 text-sm">@{profile.username}</span>
                <span className="text-slate-700">·</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  profile.role === "organizer"
                    ? "bg-orange-500/15 border border-orange-500/30 text-orange-300"
                    : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                }`}>
                  {profile.role}
                </span>
                {profile.country && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">{profile.country}</span>
                  </>
                )}
                {profile.memberSince && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">
                      Member since {new Date(profile.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </>
                )}
              </div>
              {profile.bio && <p className="text-sm text-slate-400 mt-1.5">{profile.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Game tags */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="font-display text-base font-bold text-white">Games</h2>
          </div>
          {profile.gameProfiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.gameProfiles.map((gp, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-sm text-white">
                  {gp.gameName}
                  <span className="ml-2 text-xs text-orange-400 capitalize">{gp.rank || gp.skillLevel}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">This player hasn't added any games yet.</p>
          )}
        </div>

        {/* Career stats — live from the stats engine */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="font-display text-base font-bold text-white">Career Stats</h2>
          </div>
          <CareerStatsGrid username={profile.username} />
        </div>

        {/* Badges — spec §2 */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="font-display text-base font-bold text-white">Badges</h2>
          </div>
          <BadgeWall username={profile.username} />
        </div>

        {/* Social links */}
        {socialEntries.length > 0 && (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-orange-400" />
              </div>
              <h2 className="font-display text-base font-bold text-white">Socials</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {socialEntries.map(([key, value]) =>
                value.startsWith("http") ? (
                  <a key={key} href={value} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-sm text-cyan-300 hover:border-cyan-500/50 capitalize transition-colors">
                    {key}
                  </a>
                ) : (
                  <span key={key} className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-sm text-white capitalize">
                    {key}: <span className="text-slate-300">{value}</span>
                  </span>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
