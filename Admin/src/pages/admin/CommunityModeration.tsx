import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2, Filter, Loader2, MessageSquare, Pin, PinOff,
  Plus, RefreshCw, ShieldAlert, Trash2, X,
} from 'lucide-react';
import { apiGet, apiPatch, apiPost, apiDelete } from '../../utils/api.utils';
import { getAdminAccessToken } from '../../utils/auth.utils';
import { API_BASE_URLS } from '../../config/api.config';
import { toast } from 'react-toastify';

// Community moderation (new_build.md Phase 5B): admins keep full authority
// over the social feed — review flagged posts, override-remove any abusive
// post (owner-delete stays with the author in the Client app), pin
// announcements, and manage the keyword filter that scrubs every post.

const POSTS_BASE = `${API_BASE_URLS.COMMUNITY}/posts`;
const KEYWORDS_BASE = `${API_BASE_URLS.COMMUNITY}/admin/keyword-filters`;

function adminHeaders(): { headers: Record<string, string> } {
  const token = getAdminAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers };
}

const inputCls =
  'w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors';

interface ModPost {
  id: string;
  authorUsername: string;
  title: string;
  content: string;
  status: string;
  isPinned: boolean;
  isFlagged: boolean;
  score: number;
  commentCount: number;
  createdAt?: string;
}

function mapPost(raw: Record<string, unknown>): ModPost {
  const author = (raw.author_id ?? {}) as Record<string, unknown>;
  return {
    id: String(raw._id ?? ''),
    authorUsername: String(author.username ?? 'Unknown'),
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),
    status: String(raw.status ?? 'active'),
    isPinned: Boolean(raw.is_pinned ?? false),
    isFlagged: Boolean(raw.is_flagged ?? false),
    score: Number(raw.score ?? 0),
    commentCount: Number(raw.comment_count ?? 0),
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
  };
}

interface KeywordRow {
  word: string;
  action: 'replace' | 'flag' | 'block';
}

type Tab = 'flagged' | 'recent' | 'keywords';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Post row with moderation actions ─────────────────────────────────────────

function PostRow({ post, onChanged }: { post: ModPost; onChanged: () => void }) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const moderate = async (status: 'active' | 'removed', why: string) => {
    setBusy(status);
    try {
      const res = await apiPatch(`${POSTS_BASE}/admin/${post.id}/moderate`, { status, reason: why }, adminHeaders());
      if (!res.success) throw new Error(res.error?.message ?? 'Moderation failed');
      toast.success(status === 'removed' ? 'Post removed.' : 'Post restored.');
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Moderation failed.');
    } finally {
      setBusy(null);
      setRemoveOpen(false);
      setReason('');
    }
  };

  const togglePin = async () => {
    setBusy('pin');
    try {
      const res = await apiPatch(`${POSTS_BASE}/admin/${post.id}/pin`, { pin: !post.isPinned }, adminHeaders());
      if (!res.success) throw new Error(res.error?.message ?? 'Pin failed');
      toast.success(post.isPinned ? 'Post unpinned.' : 'Post pinned.');
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Pin failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`rounded-xl border bg-slate-900/60 p-4 ${post.isFlagged ? 'border-amber-500/40' : 'border-slate-800'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            <span className="font-semibold text-slate-300">@{post.authorUsername}</span>
            <span>· {timeAgo(post.createdAt)}</span>
            {post.isFlagged && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                FLAGGED
              </span>
            )}
            {post.status === 'removed' && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold">
                REMOVED
              </span>
            )}
            {post.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
          </div>
          <p className="text-sm font-semibold text-white mt-1.5 break-words">{post.title}</p>
          <p className="text-sm text-slate-400 mt-0.5 line-clamp-3 break-words">{post.content}</p>
          <p className="text-[11px] text-slate-600 mt-1.5">score {post.score} · {post.commentCount} comments</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => void togglePin()}
            disabled={busy !== null}
            title={post.isPinned ? 'Unpin' : 'Pin'}
            className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
          >
            {busy === 'pin' ? <Loader2 className="w-4 h-4 animate-spin" /> : post.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
          {post.status === 'removed' ? (
            <button
              onClick={() => void moderate('active', 'Restored by admin review')}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
            >
              {busy === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Restore
            </button>
          ) : (
            <button
              onClick={() => setRemoveOpen((o) => !o)}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      {removeOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for removal (min 5 characters) — shown in the audit log"
            className={inputCls}
          />
          <div className="flex gap-2">
            <button
              onClick={() => void moderate('removed', reason.trim())}
              disabled={busy !== null || reason.trim().length < 5}
              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-400 disabled:opacity-50 transition-colors"
            >
              {busy === 'removed' ? 'Removing…' : 'Confirm Removal'}
            </button>
            <button
              onClick={() => { setRemoveOpen(false); setReason(''); }}
              className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityModeration() {
  const [tab, setTab] = useState<Tab>('flagged');
  const [posts, setPosts] = useState<ModPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Keyword filter state
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newAction, setNewAction] = useState<KeywordRow['action']>('replace');
  const [kwBusy, setKwBusy] = useState(false);

  const loadPosts = useCallback(() => {
    setLoading(true);
    const url = tab === 'flagged'
      ? `${POSTS_BASE}/admin/flagged?limit=30`
      : `${POSTS_BASE}?sort=recent&limit=30`;
    apiGet(url, { ...adminHeaders(), skipCache: true })
      .then((res) => {
        if (!res.success) { setPosts([]); return; }
        const data = res.data as Record<string, unknown>;
        const list = ((data.posts ?? []) as Record<string, unknown>[]).map(mapPost);
        setPosts(list);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const loadKeywords = useCallback(() => {
    setKwLoading(true);
    apiGet(KEYWORDS_BASE, { ...adminHeaders(), skipCache: true })
      .then((res) => {
        if (!res.success) { setKeywords([]); return; }
        const data = res.data as Record<string, unknown>;
        const list = ((data.filters ?? []) as Record<string, unknown>[]).map((f) => ({
          word: String(f.word ?? ''),
          action: (['replace', 'flag', 'block'].includes(String(f.action)) ? String(f.action) : 'replace') as KeywordRow['action'],
        }));
        setKeywords(list);
      })
      .catch(() => setKeywords([]))
      .finally(() => setKwLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'keywords') loadKeywords();
    else loadPosts();
  }, [tab, loadPosts, loadKeywords]);

  const addKeyword = async () => {
    const word = newWord.trim().toLowerCase();
    if (!word) return;
    setKwBusy(true);
    try {
      const res = await apiPost(KEYWORDS_BASE, { word, action: newAction }, adminHeaders());
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to add word');
      toast.success(`"${word}" added (${newAction}).`);
      setNewWord('');
      loadKeywords();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add word.');
    } finally {
      setKwBusy(false);
    }
  };

  const removeKeyword = async (word: string) => {
    setKwBusy(true);
    try {
      const res = await apiDelete(`${KEYWORDS_BASE}/${encodeURIComponent(word)}`, adminHeaders());
      if (!res.success) throw new Error(res.error?.message ?? 'Failed to remove word');
      toast.success(`"${word}" removed.`);
      setKeywords((prev) => prev.filter((k) => k.word !== word));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove word.');
    } finally {
      setKwBusy(false);
    }
  };

  const ACTION_HINT: Record<KeywordRow['action'], string> = {
    replace: 'starred out (****)',
    flag: 'post flagged for review',
    block: 'post blocked entirely',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" /> Community Moderation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review flagged posts, remove abusive content, pin announcements, and manage the keyword filter.
          </p>
        </div>
        {tab !== 'keywords' && (
          <button
            onClick={loadPosts}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {([
          { id: 'flagged', label: 'Flagged', icon: ShieldAlert },
          { id: 'recent', label: 'Recent Posts', icon: MessageSquare },
          { id: 'keywords', label: 'Keyword Filter', icon: Filter },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Posts tabs */}
      {tab !== 'keywords' && (
        loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-slate-800 bg-slate-900/40">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 mt-3">
              {tab === 'flagged' ? 'No flagged posts — all clear.' : 'No posts yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => <PostRow key={p.id} post={p} onChanged={loadPosts} />)}
          </div>
        )
      )}

      {/* Keyword filter tab */}
      {tab === 'keywords' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <p className="text-xs text-slate-400">
              Filtered words apply to every community post and comment: <span className="text-slate-300">replace</span> stars
              the word out, <span className="text-amber-300">flag</span> sends the post here for review,
              <span className="text-red-300"> block</span> rejects the post entirely.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Word or phrase to filter"
                className={`${inputCls} flex-1 min-w-[180px]`}
              />
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value as KeywordRow['action'])}
                className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer [&>option]:bg-slate-800"
              >
                <option value="replace">Replace (****)</option>
                <option value="flag">Flag for review</option>
                <option value="block">Block post</option>
              </select>
              <button
                onClick={() => void addKeyword()}
                disabled={kwBusy || !newWord.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {kwBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>

          {kwLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
          ) : keywords.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No filtered words yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span
                  key={k.word}
                  title={ACTION_HINT[k.action]}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${
                    k.action === 'block'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : k.action === 'flag'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  {k.word}
                  <span className="text-[9px] uppercase opacity-70">{k.action}</span>
                  <button
                    onClick={() => void removeKeyword(k.word)}
                    disabled={kwBusy}
                    className="hover:text-white disabled:opacity-50 transition-colors"
                    aria-label={`Remove ${k.word}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
