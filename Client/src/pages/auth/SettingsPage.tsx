import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, CheckCircle2, KeyRound, Loader2,
  LogOut, Monitor, Settings, User, X,
} from "lucide-react";
import { apiGet, apiPatch, apiPost, apiDelete } from "../../utils/api.utils";
import { AUTH_ENDPOINTS } from "../../config/api.config";
import { useAuth } from "../../lib/auth-context";

type Tab = "profile" | "security" | "sessions";

interface Session {
  sessionId: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt?: string;
  lastUsedAt?: string;
  isCurrent?: boolean;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile
  const [displayName, setDisplayName] = useState(user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.username ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
    setTimeout(() => { setSuccess(null); setError(null); }, 5000);
  };

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await apiGet(AUTH_ENDPOINTS.SESSIONS);
      if (res.success) {
        const data = res.data as Record<string, unknown>;
        const raw = (Array.isArray(data) ? data : (data.sessions ?? [])) as Record<string, unknown>[];
        setSessions(raw.map(s => ({
          sessionId: String(s.session_id ?? s.sessionId ?? s._id ?? s.id ?? ""),
          deviceInfo: String(s.device_info ?? s.deviceInfo ?? s.user_agent ?? "Unknown device"),
          ipAddress: String(s.ip_address ?? s.ipAddress ?? ""),
          createdAt: String(s.created_at ?? s.createdAt ?? ""),
          lastUsedAt: String(s.last_used_at ?? s.lastUsedAt ?? ""),
          isCurrent: Boolean(s.is_current ?? s.isCurrent ?? false),
        })));
      }
    } catch {
      // non-critical
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "sessions") void loadSessions();
  }, [tab, loadSessions]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const body: Record<string, string> = {};
      if (displayName.trim()) body.display_name = displayName.trim();
      if (username.trim()) body.username = username.trim();
      const res = await apiPatch(AUTH_ENDPOINTS.UPDATE_PROFILE, body);
      if (!res.success) throw new Error((res as { error?: { message?: string } }).error?.message ?? "Update failed");
      showMsg("Profile updated. Refresh the page to see changes.");
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Failed to update profile.", true);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw) { showMsg("Fill in all password fields.", true); return; }
    if (newPw !== confirmPw) { showMsg("New passwords do not match.", true); return; }
    if (newPw.length < 8) { showMsg("New password must be at least 8 characters.", true); return; }
    setSavingPw(true);
    try {
      const res = await apiPost(AUTH_ENDPOINTS.PASSWORD_CHANGE, {
        current_password: currentPw,
        new_password: newPw,
      });
      if (!res.success) throw new Error((res as { error?: { message?: string } }).error?.message ?? "Password change failed");
      showMsg("Password changed successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Failed to change password.", true);
    } finally {
      setSavingPw(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await apiDelete(`${AUTH_ENDPOINTS.SESSION_REVOKE_SPECIFIC}/${sessionId}`);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch {
      showMsg("Failed to revoke session.", true);
    } finally {
      setRevokingId(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <KeyRound className="w-4 h-4" /> },
    { id: "sessions", label: "Sessions", icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" /> Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account preferences and security.</p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4 opacity-60" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4 opacity-60" /></button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <h2 className="font-semibold text-white">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Email</label>
              <input value={user?.email ?? ""} disabled
                className="w-full bg-slate-800/30 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
              <p className="text-[11px] text-slate-600 mt-1">Email cannot be changed.</p>
            </div>
          </div>
          <button onClick={() => { void saveProfile(); }} disabled={savingProfile}
            className="w-full py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {savingProfile ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <h2 className="font-semibold text-white">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <button onClick={() => { void changePassword(); }} disabled={savingPw}
            className="w-full py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {savingPw ? "Changing…" : "Change Password"}
          </button>
        </div>
      )}

      {/* Sessions tab */}
      {tab === "sessions" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Active Sessions</h2>
            <button onClick={() => { void loadSessions(); }}
              className="text-xs text-slate-400 hover:text-white transition-colors">
              Refresh
            </button>
          </div>
          {loadingSessions ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">No sessions found.</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {sessions.map(s => (
                <div key={s.sessionId} className={`flex items-start gap-3 px-5 py-4 ${s.isCurrent ? "bg-cyan-950/20" : ""}`}>
                  <Monitor className={`w-5 h-5 mt-0.5 shrink-0 ${s.isCurrent ? "text-cyan-400" : "text-slate-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {s.deviceInfo || "Unknown device"}
                      {s.isCurrent && <span className="ml-2 text-[10px] text-cyan-400 font-bold">CURRENT</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.ipAddress && `${s.ipAddress} · `}
                      Last active {fmtDate(s.lastUsedAt || s.createdAt)}
                    </p>
                  </div>
                  {!s.isCurrent && (
                    <button onClick={() => { void revokeSession(s.sessionId); }} disabled={revokingId === s.sessionId}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 transition-colors">
                      {revokingId === s.sessionId ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
