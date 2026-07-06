import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown, ChevronUp, Loader2, MessagesSquare, RefreshCw, Search, Shield, Users, X,
} from 'lucide-react';
import { apiGet } from '../../utils/api.utils';
import { getAdminAccessToken } from '../../utils/auth.utils';
import { API_BASE_URLS } from '../../config/api.config';

// Teams oversight: admins can find any team and read its chat (read-only,
// for moderation and dispute review). Admins do not post into team chats.

const TEAMS_URL = 'https://api-apexarenas.onrender.com/api/v1/tournament/teams';
const TEAM_CHAT_ADMIN = (teamId: string) =>
  `${API_BASE_URLS.COMMUNITY}/teams/${teamId}/chat/admin/messages`;

function adminHeaders(): { headers: Record<string, string> } {
  const token = getAdminAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers };
}

interface TeamRow {
  id: string;
  name: string;
  tag?: string;
  gameName?: string;
  captainUsername?: string;
  memberCount: number;
  isRecruiting: boolean;
}

interface ChatRow {
  id: string;
  sender: string;
  content: string;
  createdAt?: string;
  isDeleted: boolean;
}

function mapTeam(raw: Record<string, unknown>): TeamRow {
  const game = (raw.game_id ?? {}) as Record<string, unknown>;
  const captain = (raw.captain_id ?? {}) as Record<string, unknown>;
  const members = (raw.members ?? []) as unknown[];
  const settings = (raw.settings ?? {}) as Record<string, unknown>;
  return {
    id: String(raw._id ?? ''),
    name: String(raw.name ?? ''),
    tag: raw.tag ? String(raw.tag) : undefined,
    gameName: game && typeof game === 'object' && game.name ? String(game.name) : undefined,
    captainUsername: captain && typeof captain === 'object' && captain.username ? String(captain.username) : undefined,
    memberCount: members.length,
    isRecruiting: Boolean(settings.is_recruiting ?? false),
  };
}

function mapChat(raw: Record<string, unknown>): ChatRow {
  return {
    id: String(raw._id ?? ''),
    sender: String(raw.sender_display_name ?? 'Unknown'),
    content: String(raw.content ?? ''),
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
    isDeleted: Boolean(raw.is_deleted ?? false),
  };
}

function fmtTime(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ChatViewer({ teamId }: { teamId: string }) {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet(`${TEAM_CHAT_ADMIN(teamId)}?limit=50`, { ...adminHeaders(), skipCache: true })
      .then((res) => {
        if (!res.success) {
          // An empty room and a failing endpoint are different things,
          // surface the real reason instead of pretending the chat is empty
          setError(res.error?.message ?? 'Failed to load chat (is the server up to date?)');
          setMessages([]);
          return;
        }
        const data = res.data as Record<string, unknown>;
        const list = ((data.messages ?? []) as Record<string, unknown>[]).map(mapChat);
        setMessages(list.reverse());
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load chat'))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>;
  }
  if (error) {
    return (
      <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }
  if (messages.length === 0) {
    return <p className="text-xs text-slate-500 text-center py-4">No chat messages in this team.</p>;
  }

  return (
    <div className="max-h-72 overflow-y-auto space-y-2">
      {messages.map((m) => (
        <div key={m.id} className="rounded-lg bg-slate-800/50 border border-slate-700/50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">{m.sender}</span>
            <span className="text-[10px] text-slate-600">{fmtTime(m.createdAt)}</span>
          </div>
          {m.isDeleted ? (
            <p className="text-xs text-slate-500 italic mt-0.5">message deleted by sender</p>
          ) : (
            <p className="text-sm text-slate-200 break-words mt-0.5">{m.content}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TeamsOversight() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiGet(TEAMS_URL, { ...adminHeaders(), skipCache: true })
      .then((res) => {
        if (!res.success) { setTeams([]); return; }
        const data = res.data as Record<string, unknown>;
        const list = (Array.isArray(res.data) ? res.data : (data.teams ?? data.data ?? [])) as Record<string, unknown>[];
        setTeams(list.map(mapTeam));
      })
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? teams.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tag?.toLowerCase().includes(search.toLowerCase()) ||
        t.captainUsername?.toLowerCase().includes(search.toLowerCase()) ||
        t.gameName?.toLowerCase().includes(search.toLowerCase()))
    : teams;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" /> Teams Oversight
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Every team on the platform, expand one to read its chat (read-only, for moderation).
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team, tag, captain, or game…"
          className="w-full pl-9 pr-9 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-slate-800 bg-slate-900/40">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 mt-3">No teams found.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((team) => (
            <div key={team.id} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === team.id ? null : team.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                    {team.tag && <span className="text-[10px] text-slate-500 font-mono">[{team.tag}]</span>}
                    {team.isRecruiting && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">Recruiting</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                    {team.gameName ? ` · ${team.gameName}` : ''}
                    {team.captainUsername ? ` · captain @${team.captainUsername}` : ''}
                  </p>
                </div>
                {expandedId === team.id
                  ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
              </button>

              {expandedId === team.id && (
                <div className="border-t border-slate-800 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <MessagesSquare className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Team chat (read-only)</p>
                  </div>
                  <ChatViewer teamId={team.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
