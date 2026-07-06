import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, Loader2, MessagesSquare, Send, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { getOrCreateSocket } from "../lib/socket";
import { apiGet, apiPost, apiDelete } from "../utils/api.utils";
import { TEAM_CHAT_ENDPOINTS } from "../config/api.config";
import { mapChatMessage, type TournamentChatMessage } from "../services/tournament-chat.service";

// Team chat for members (backend has existed all along, this is its first UI).
// Same bubble language as the tournament chat: my messages right-aligned in
// the accent colour, teammates left-aligned in slate.

const MAX_LENGTH = 500;

function formatTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function useTeamChat(teamId: string) {
  const { tokens, user } = useAuth();
  const [messages, setMessages] = useState<TournamentChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootedRef = useRef<string | null>(null);

  const loadPage = useCallback(async (tid: string, pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet(
        `${TEAM_CHAT_ENDPOINTS.BASE}/${tid}/chat/messages?page=${pageNum}&limit=20`,
        { skipCache: true },
      );
      if (!res.success) throw new Error(res.error?.message ?? "Failed to load chat");
      const data = res.data as Record<string, unknown>;
      const list = (Array.isArray(data) ? data : (data.messages ?? data.data ?? [])) as Record<string, unknown>[];
      const chronological = list.map(mapChatMessage).reverse();
      setMessages((prev) => (pageNum === 1 ? chronological : [...chronological, ...prev]));
      setHasMore(Boolean(data.has_more ?? false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!teamId || bootedRef.current === teamId) return;
    bootedRef.current = teamId;
    setPage(1);
    setMessages([]);
    loadPage(teamId, 1);
  }, [teamId, loadPage]);

  const loadOlder = useCallback(() => {
    if (isLoading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadPage(teamId, next);
  }, [teamId, isLoading, hasMore, page, loadPage]);

  // Live messages while the panel is open
  useEffect(() => {
    const token = tokens?.accessToken;
    if (!teamId || !token || !user) return;

    const socket = getOrCreateSocket(token);

    const handleMessage = (payload: Record<string, unknown>) => {
      const incoming = mapChatMessage(payload);
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    };

    socket.emit("join:team_chat", teamId);
    socket.on("team_chat:message", handleMessage);

    return () => {
      socket.emit("leave:team_chat", teamId);
      socket.off("team_chat:message", handleMessage);
    };
  }, [teamId, tokens?.accessToken, user]);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!teamId || !trimmed) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await apiPost(`${TEAM_CHAT_ENDPOINTS.BASE}/${teamId}/chat/messages`, { content: trimmed });
      if (!res.success) throw new Error(res.error?.message ?? "Failed to send message");
      const data = res.data as Record<string, unknown>;
      const sent = mapChatMessage((data.message ?? data) as Record<string, unknown>);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [teamId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const res = await apiDelete(`${TEAM_CHAT_ENDPOINTS.BASE}/${teamId}/chat/messages/${messageId}`);
      if (!res.success) throw new Error(res.error?.message ?? "Failed to delete message");
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: "" } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete message");
    }
  }, [teamId]);

  return { messages, isLoading, isSending, hasMore, error, loadOlder, sendMessage, deleteMessage };
}

export default function TeamChatPanel({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const { messages, isLoading, isSending, hasMore, error, loadOlder, sendMessage, deleteMessage } =
    useTeamChat(teamId);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  const submit = async () => {
    if (!draft.trim() || isSending) return;
    await sendMessage(draft);
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-800/60">
        <MessagesSquare className="w-4 h-4 text-cyan-400" />
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Team Chat</h4>
      </div>

      <div className="max-h-72 overflow-y-auto px-3.5 py-3 space-y-2.5">
        {hasMore && (
          <button
            onClick={loadOlder}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-white transition-colors py-1"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
            Load older messages
          </button>
        )}

        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No messages yet, say hello to the squad.</p>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === user?.id;
            return (
              <div key={message.id} className={`group flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                <div
                  className={`max-w-[80%] min-w-0 rounded-2xl px-3 py-2 ${
                    isMine
                      ? "bg-cyan-500/15 border border-cyan-500/25 rounded-br-sm"
                      : "bg-slate-800/70 border border-slate-700/60 rounded-bl-sm"
                  }`}
                >
                  <div className={`flex items-center gap-1.5 ${isMine ? "justify-end" : ""}`}>
                    {!isMine && (
                      <span className="text-xs font-semibold text-slate-300">{message.senderDisplayName}</span>
                    )}
                    <span className="text-[10px] text-slate-600">{formatTime(message.createdAt)}</span>
                  </div>
                  {message.isDeleted ? (
                    <p className="text-xs text-slate-500 italic mt-0.5">message deleted</p>
                  ) : (
                    <p className={`text-sm text-slate-200 break-words mt-0.5 ${isMine ? "text-right" : ""}`}>
                      {message.content}
                    </p>
                  )}
                </div>
                {isMine && !message.isDeleted && (
                  <button
                    onClick={() => void deleteMessage(message.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 shrink-0"
                    aria-label="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-3.5 pb-1 text-[11px] text-red-400">{error}</p>}

      <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-slate-800/60">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
          placeholder="Message your team…"
          maxLength={MAX_LENGTH}
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => void submit()}
          disabled={isSending || !draft.trim()}
          className="p-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          aria-label="Send message"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
