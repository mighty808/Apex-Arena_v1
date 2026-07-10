import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, UserMinus, UserX2 } from "lucide-react";
import { apiGet, apiDelete } from "../utils/api.utils";
import { showError, showSuccess } from "../utils/toast.utils";

// Followers/Following management on the owner's profile: view both lists,
// unfollow people you follow, and remove people from your followers.
// The backend blocks self-follow and privacy-gates these lists for visitors;
// the owner always sees their own.

const COMMUNITY_USERS = "https://api-apexarenas.onrender.com/api/v1/community/users";

interface FollowRow {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

function mapRow(raw: Record<string, unknown>, key: "follower_id" | "following_id"): FollowRow | null {
  const user = (raw[key] ?? {}) as Record<string, unknown>;
  if (!user || !user.username) return null;
  const profile = (user.profile ?? {}) as Record<string, unknown>;
  const first = String(profile.first_name ?? "");
  const last = String(profile.last_name ?? "");
  return {
    userId: String(user._id ?? ""),
    username: String(user.username),
    displayName: `${first} ${last}`.trim() || String(user.username),
    avatarUrl: profile.avatar_url ? String(profile.avatar_url) : undefined,
  };
}

export default function FollowListsPanel({ userId }: { userId: string }) {
  const [view, setView] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<FollowRow[]>([]);
  const [following, setFollowing] = useState<FollowRow[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGet(`${COMMUNITY_USERS}/${userId}/followers?limit=50`, { skipCache: true }),
      apiGet(`${COMMUNITY_USERS}/${userId}/following?limit=50`, { skipCache: true }),
    ])
      .then(([fRes, gRes]) => {
        if (fRes.success) {
          const data = fRes.data as Record<string, unknown>;
          const rows = ((data.followers ?? []) as Record<string, unknown>[])
            .map((r) => mapRow(r, "follower_id"))
            .filter((r): r is FollowRow => r !== null);
          setFollowers(rows);
          setCounts((c) => ({ ...c, followers: Number(data.total ?? rows.length) }));
        }
        if (gRes.success) {
          const data = gRes.data as Record<string, unknown>;
          const rows = ((data.following ?? []) as Record<string, unknown>[])
            .map((r) => mapRow(r, "following_id"))
            .filter((r): r is FollowRow => r !== null);
          setFollowing(rows);
          setCounts((c) => ({ ...c, following: Number(data.total ?? rows.length) }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const unfollow = async (target: FollowRow) => {
    setBusyId(target.userId);
    try {
      const res = await apiDelete(`${COMMUNITY_USERS}/${target.userId}/follow`);
      if (!res.success) throw new Error(res.error?.message ?? "Failed to unfollow");
      setFollowing((prev) => prev.filter((r) => r.userId !== target.userId));
      setCounts((c) => ({ ...c, following: Math.max(0, c.following - 1) }));
      showSuccess(`Unfollowed ${target.username}.`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to unfollow.");
    } finally {
      setBusyId(null);
    }
  };

  const removeFollower = async (target: FollowRow) => {
    setBusyId(target.userId);
    try {
      const res = await apiDelete(`${COMMUNITY_USERS}/${target.userId}/follower`);
      if (!res.success) throw new Error(res.error?.message ?? "Failed to remove follower");
      setFollowers((prev) => prev.filter((r) => r.userId !== target.userId));
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }));
      showSuccess(`${target.username} removed from your followers.`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to remove follower.");
    } finally {
      setBusyId(null);
    }
  };

  const rows = view === "followers" ? followers : following;

  return (
    <div>
      {/* Counts double as the list switcher */}
      <div className="flex items-center gap-2 mb-4">
        {([
          { id: "followers", label: "Followers", count: counts.followers },
          { id: "following", label: "Following", count: counts.following },
        ] as { id: "followers" | "following"; label: string; count: number }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === t.id
                ? "bg-orange-500 text-slate-950"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t.count} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          {view === "followers"
            ? "No followers yet. Share your player card to grow your audience."
            : "You aren't following anyone yet. Find players via search and follow them."}
        </p>
      ) : (
        <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/30">
          {rows.map((row) => (
            <div key={row.userId} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                {row.avatarUrl ? (
                  <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-400">{row.username[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/players/${encodeURIComponent(row.username)}`}
                  className="text-sm text-white font-medium truncate hover:text-orange-300 transition-colors"
                >
                  {row.displayName}
                </Link>
                <p className="text-xs text-slate-500 truncate">@{row.username}</p>
              </div>
              {view === "following" ? (
                <button
                  onClick={() => void unfollow(row)}
                  disabled={busyId !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  {busyId === row.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => void removeFollower(row)}
                  disabled={busyId !== null}
                  title="Remove this person from your followers"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/25 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                >
                  {busyId === row.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX2 className="w-3 h-3" />}
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
