import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowBigDown, ArrowBigUp, Loader2, MessageSquare, Mic, Pin,
  Plus, RefreshCw, Send, Trash2, Users, UsersRound, X,
} from "lucide-react";
import {
  communityService,
  type CommunityPost,
  type CommentThread,
  type FeedSort,
  type LfgPost,
} from "../../services/community.service";
import { apiGet } from "../../utils/api.utils";
import { TOURNAMENT_ENDPOINTS } from "../../config/api.config";
import { showError, showSuccess } from "../../utils/toast.utils";
import { useAuth } from "../../lib/auth-context";

// Community hub (spec §6, new_build.md Phase 5): social feed (posts, votes,
// comments, backend already live) + LFG board (team recruitment).
// Backend gap noted in new_build.md: only team captains can create LFG posts
// ("team looking for player"); player-side "looking for team" posts need a
// new endpoint first.

type Tab = "feed" | "lfg";

interface GameOption { id: string; name: string }

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ url, name, size = 8 }: { url?: string; name: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center`}
      style={{ width: size * 4, height: size * 4 }}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-slate-400">{(name[0] ?? "?").toUpperCase()}</span>
      )}
    </div>
  );
}

// ─── Comments (expand under a post) ──────────────────────────────────────────

function CommentsSection({ postId, onCommentAdded }: { postId: string; onCommentAdded: () => void }) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    communityService.getComments(postId)
      .then((res) => setThreads(res.threads))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      await communityService.addComment(postId, content);
      setDraft("");
      load();
      onCommentAdded();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to add comment.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-3">
      {/* Composer */}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
          placeholder="Add a comment…"
          maxLength={500}
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70"
        />
        <button
          onClick={() => void submit()}
          disabled={sending || !draft.trim()}
          className="px-3 rounded-lg bg-orange-500 text-slate-950 hover:bg-orange-400 disabled:opacity-50 transition-colors"
          aria-label="Send comment"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
      ) : threads.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-2">No comments yet, be the first.</p>
      ) : (
        <div className="space-y-3">
          {threads.map(({ comment, replies }) => (
            <div key={comment.id}>
              <div className="flex gap-2.5">
                <Avatar url={comment.author.avatarUrl} name={comment.author.username} size={7} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <Link to={`/players/${encodeURIComponent(comment.author.username)}`} className="font-semibold text-white hover:text-orange-300">
                      {comment.author.username}
                    </Link>
                    <span className="text-slate-600 ml-2">{timeAgo(comment.createdAt)}</span>
                  </p>
                  <p className="text-sm text-slate-300 mt-0.5 break-words">{comment.content}</p>
                </div>
              </div>
              {replies.length > 0 && (
                <div className="ml-9 mt-2 space-y-2 border-l border-slate-800 pl-3">
                  {replies.map((r) => (
                    <div key={r.id} className="flex gap-2">
                      <Avatar url={r.author.avatarUrl} name={r.author.username} size={6} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">{r.author.username}
                          <span className="text-slate-600 font-normal ml-2">{timeAgo(r.createdAt)}</span>
                        </p>
                        <p className="text-sm text-slate-300 mt-0.5 break-words">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post: initial,
  viewerId,
  onDeleted,
}: {
  post: CommunityPost;
  viewerId?: string;
  onDeleted: (postId: string) => void;
}) {
  const [post, setPost] = useState(initial);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [voting, setVoting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = Boolean(viewerId && post.author.id === viewerId);

  const deletePost = async () => {
    setDeleting(true);
    try {
      await communityService.deletePost(post.id);
      showSuccess("Post deleted.");
      onDeleted(post.id);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to delete post.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const vote = async (direction: "up" | "down") => {
    if (voting) return;
    setVoting(true);
    try {
      const result = await communityService.votePost(post.id, direction);
      setPost((p) => ({
        ...p,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        score: result.score,
        viewerVote: result.direction,
      }));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to vote.");
    } finally {
      setVoting(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex gap-3">
        {/* Vote column: upvotes and downvotes are counted and shown separately.
            Switching direction moves your vote (the server records the change),
            and tapping the same arrow again withdraws it. */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => void vote("up")}
            disabled={voting}
            aria-label="Upvote"
            className={`flex flex-col items-center px-1.5 py-1 rounded-lg transition-colors ${
              post.viewerVote === "up" ? "text-orange-400 bg-orange-500/10" : "text-slate-500 hover:text-orange-400 hover:bg-orange-500/5"
            }`}
          >
            <ArrowBigUp className="w-5 h-5" />
            <span className={`text-xs font-bold tabular-nums ${post.viewerVote === "up" ? "text-orange-300" : "text-slate-400"}`}>
              {post.upvotes}
            </span>
          </button>
          <button
            onClick={() => void vote("down")}
            disabled={voting}
            aria-label="Downvote"
            className={`flex flex-col items-center px-1.5 py-1 rounded-lg transition-colors ${
              post.viewerVote === "down" ? "text-blue-400 bg-blue-500/10" : "text-slate-500 hover:text-blue-400 hover:bg-blue-500/5"
            }`}
          >
            <ArrowBigDown className="w-5 h-5" />
            <span className={`text-xs font-bold tabular-nums ${post.viewerVote === "down" ? "text-blue-300" : "text-slate-400"}`}>
              {post.downvotes}
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Avatar url={post.author.avatarUrl} name={post.author.username} size={6} />
            <Link to={`/players/${encodeURIComponent(post.author.username)}`} className="font-semibold text-slate-300 hover:text-orange-300">
              {post.author.username}
            </Link>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            {post.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
            {/* Delete, strictly the owner here; admins moderate from the Admin app */}
            {isOwner && (
              <span className="ml-auto flex items-center gap-1.5">
                {confirmDelete ? (
                  <>
                    <button
                      onClick={() => void deletePost()}
                      disabled={deleting}
                      className="px-2 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold hover:bg-red-500/25 disabled:opacity-50 transition-colors"
                    >
                      {deleting ? "Deleting…" : "Confirm delete"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="px-2 py-1 rounded-md border border-slate-700 text-slate-400 text-[10px] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            )}
          </div>
          <h3 className="font-display text-base font-bold text-white mt-2 break-words">{post.title}</h3>
          <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap break-words">{post.content}</p>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {post.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">#{t}</span>
              ))}
            </div>
          )}
          <button
            onClick={() => setCommentsOpen((o) => !o)}
            className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 hover:text-white transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </button>

          {commentsOpen && (
            <CommentsSection
              postId={post.id}
              onCommentAdded={() => setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }))}
            />
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("feed");
  const [games, setGames] = useState<GameOption[]>([]);

  // Feed state
  const [sort, setSort] = useState<FeedSort>("recent");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [posting, setPosting] = useState(false);

  // LFG state
  const [lfgGameId, setLfgGameId] = useState("all");
  const [lfgPosts, setLfgPosts] = useState<LfgPost[]>([]);
  const [lfgLoading, setLfgLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [lftOpen, setLftOpen] = useState(false);
  const [lftGameId, setLftGameId] = useState("");
  const [lftTitle, setLftTitle] = useState("");
  const [lftDescription, setLftDescription] = useState("");
  const [lftRoles, setLftRoles] = useState("");
  const [lftSkill, setLftSkill] = useState("any");
  const [lftSubmitting, setLftSubmitting] = useState(false);

  useEffect(() => {
    apiGet(TOURNAMENT_ENDPOINTS.GAMES, { skipAuth: true })
      .then((res) => {
        if (!res.success) return;
        const raw = res.data as Record<string, unknown>;
        const list = (Array.isArray(raw) ? raw : ((raw.games ?? raw.data ?? []) as Record<string, unknown>[]));
        setGames(list.map((g) => ({ id: String(g._id ?? g.id ?? ""), name: String(g.name ?? "") })));
      })
      .catch(() => {});
  }, []);

  const loadFeed = useCallback((pageNum: number, replace: boolean) => {
    setFeedLoading(true);
    communityService.getFeed({ sort, page: pageNum })
      .then((res) => {
        setPosts((prev) => (replace ? res.posts : [...prev, ...res.posts]));
        setFeedHasMore(res.hasMore);
        setFeedPage(pageNum);
      })
      .catch(() => { if (replace) setPosts([]); })
      .finally(() => setFeedLoading(false));
  }, [sort]);

  useEffect(() => { loadFeed(1, true); }, [loadFeed]);

  useEffect(() => {
    if (tab !== "lfg") return;
    setLfgLoading(true);
    communityService.getLfgPosts({ gameId: lfgGameId === "all" ? undefined : lfgGameId })
      .then(setLfgPosts)
      .catch(() => setLfgPosts([]))
      .finally(() => setLfgLoading(false));
  }, [tab, lfgGameId]);

  const submitPost = async () => {
    const title = draftTitle.trim();
    const content = draftContent.trim();
    if (title.length < 3) { showError("Title must be at least 3 characters."); return; }
    if (content.length < 10) { showError("Post must be at least 10 characters."); return; }
    setPosting(true);
    try {
      await communityService.createPost({ title, content });
      setDraftTitle(""); setDraftContent(""); setComposerOpen(false);
      showSuccess("Posted!");
      loadFeed(1, true);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to post.");
    } finally {
      setPosting(false);
    }
  };

  const submitLookingForTeam = async () => {
    if (!lftGameId) { showError("Select a game."); return; }
    if (!lftTitle.trim()) { showError("Add a short title."); return; }
    if (lftDescription.trim().length < 10) { showError("Tell teams a bit more about yourself (10+ characters)."); return; }
    setLftSubmitting(true);
    try {
      await communityService.createLookingForTeamPost({
        gameId: lftGameId,
        title: lftTitle.trim(),
        description: lftDescription.trim(),
        roles: lftRoles.split(",").map((r) => r.trim()).filter(Boolean),
        skillLevel: lftSkill,
      });
      showSuccess("Your looking-for-team post is live.");
      setLftOpen(false);
      setLftTitle(""); setLftDescription(""); setLftRoles("");
      setLfgLoading(true);
      communityService.getLfgPosts({ gameId: lfgGameId === "all" ? undefined : lfgGameId })
        .then(setLfgPosts)
        .catch(() => {})
        .finally(() => setLfgLoading(false));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to create post.");
    } finally {
      setLftSubmitting(false);
    }
  };

  const applyLfg = async (postId: string) => {
    setApplyingId(postId);
    try {
      await communityService.applyToLfgPost(postId);
      showSuccess("Application sent, the team captain will respond.");
      setLfgPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, applicantCount: p.applicantCount + 1 } : p)));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to apply.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <UsersRound className="w-6 h-6 text-orange-400" /> Community
          </h1>
          <p className="text-sm text-slate-400 mt-1">Talk shop, find teammates, hype your games.</p>
        </div>
        {tab === "feed" && (
          <button
            onClick={() => setComposerOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-orange-500 to-amber-400 text-slate-950 text-sm font-bold hover:from-orange-400 hover:to-amber-300 transition-all"
          >
            {composerOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {composerOpen ? "Close" : "New Post"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {([
          { id: "feed", label: "Feed", icon: MessageSquare },
          { id: "lfg", label: "Find a Team", icon: Users },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? "bg-orange-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Feed tab ── */}
      {tab === "feed" && (
        <div className="space-y-4">
          {/* Composer */}
          {composerOpen && (
            <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4 space-y-3">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Title"
                maxLength={200}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70"
              />
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="What's happening in your game?"
                rows={3}
                maxLength={10000}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70 resize-none"
              />
              <button
                onClick={() => void submitPost()}
                disabled={posting}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-orange-500 to-amber-400 text-slate-950 text-sm font-bold hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          )}

          {/* Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {(["recent", "top", "trending"] as FeedSort[]).map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    sort === s ? "bg-slate-800 text-white" : "text-slate-500 hover:text-white"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => loadFeed(1, true)} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors" aria-label="Refresh feed">
              <RefreshCw className={`w-4 h-4 ${feedLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Posts */}
          {feedLoading && posts.length === 0 ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-sm text-slate-500 mt-3">No posts yet, start the conversation.</p>
            </div>
          ) : (
            <>
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  viewerId={user?.id}
                  onDeleted={(postId) => setPosts((prev) => prev.filter((x) => x.id !== postId))}
                />
              ))}
              {feedHasMore && (
                <button
                  onClick={() => loadFeed(feedPage + 1, false)}
                  disabled={feedLoading}
                  className="w-full py-2.5 rounded-xl border border-slate-800 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-50 transition-colors"
                >
                  {feedLoading ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LFG tab ── */}
      {tab === "lfg" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <select
              value={lfgGameId}
              onChange={(e) => setLfgGameId(e.target.value)}
              className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/70 appearance-none cursor-pointer [&>option]:bg-slate-800"
            >
              <option value="all">All Games</option>
              {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button
              onClick={() => setLftOpen((o) => !o)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-semibold hover:bg-orange-500/20 transition-colors"
            >
              {lftOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {lftOpen ? "Close" : "I'm Looking for a Team"}
            </button>
          </div>

          {/* Player looking-for-team form (spec §6.1) */}
          {lftOpen && (
            <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={lftGameId}
                  onChange={(e) => setLftGameId(e.target.value)}
                  className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/70 appearance-none cursor-pointer [&>option]:bg-slate-800"
                >
                  <option value="">Select game…</option>
                  {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select
                  value={lftSkill}
                  onChange={(e) => setLftSkill(e.target.value)}
                  className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/70 appearance-none cursor-pointer [&>option]:bg-slate-800"
                >
                  {["any", "beginner", "intermediate", "advanced", "pro"].map((s) => (
                    <option key={s} value={s}>{s === "any" ? "Any skill level" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <input
                value={lftTitle}
                onChange={(e) => setLftTitle(e.target.value)}
                placeholder="Title, e.g. Striker looking for a competitive FIFA squad"
                maxLength={100}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70"
              />
              <input
                value={lftRoles}
                onChange={(e) => setLftRoles(e.target.value)}
                placeholder="Roles you play (comma-separated), e.g. striker, winger"
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70"
              />
              <textarea
                value={lftDescription}
                onChange={(e) => setLftDescription(e.target.value)}
                placeholder="Tell teams about your experience, availability, and what you're looking for…"
                rows={3}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70 resize-none"
              />
              <button
                onClick={() => void submitLookingForTeam()}
                disabled={lftSubmitting}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-orange-500 to-amber-400 text-slate-950 text-sm font-bold hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {lftSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {lftSubmitting ? "Posting…" : "Post"}
              </button>
            </div>
          )}

          {lfgLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : lfgPosts.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-sm text-slate-500 mt-3">No open recruitment posts right now.</p>
              <p className="text-xs text-slate-600 mt-1">Team captains can post from their team page when looking for players.</p>
            </div>
          ) : (
            lfgPosts.map((p) => (
              <article key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.postingAs === "player_looking_for_team" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                          {p.postedBy?.username ? `${p.postedBy.username} · ` : ""}Looking for Team
                        </span>
                      ) : p.team ? (
                        <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] font-bold text-orange-300">
                          {p.team.tag ? `[${p.team.tag}] ` : ""}{p.team.name} · Recruiting
                        </span>
                      ) : null}
                      {p.game && <span className="text-xs text-slate-400">{p.game.name}</span>}
                      <span className="text-xs text-slate-600">· {timeAgo(p.createdAt)}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-white mt-1.5 break-words">{p.title}</h3>
                    <p className="text-sm text-slate-300 mt-1 line-clamp-3 break-words">{p.description}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
                      {p.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">{r}</span>
                      ))}
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-300 capitalize">{p.skillLevel}</span>
                      {p.microphoneRequired && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                          <Mic className="w-2.5 h-2.5" /> Mic
                        </span>
                      )}
                      {p.region && <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">{p.region}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <button
                      onClick={() => void applyLfg(p.id)}
                      disabled={applyingId === p.id}
                      className="px-3.5 py-2 rounded-xl bg-linear-to-r from-orange-500 to-amber-400 text-slate-950 text-xs font-bold hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 transition-all"
                    >
                      {applyingId === p.id ? "Applying…" : "Apply"}
                    </button>
                    <p className="text-[10px] text-slate-600 mt-1.5">
                      {p.applicantCount} {p.applicantCount === 1 ? "applicant" : "applicants"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
