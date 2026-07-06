import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, AlertTriangle, Bell, CheckCircle2, CreditCard, KeyRound,
  Loader2, LogOut, Monitor, Settings, Smartphone, Tablet, UserCog, X,
} from "lucide-react";
import { apiGet, apiPut, apiPost, apiDelete } from "../../utils/api.utils";
import { AUTH_ENDPOINTS } from "../../config/api.config";
import { useAuth } from "../../lib/auth-context";
import {
  isPushSupported,
  getNotificationPermission,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "../../lib/push";

type Tab = "account" | "security" | "notifications" | "payment";

interface Session {
  sessionId: string;
  deviceName: string;
  deviceType: string;
  ipAddress?: string;
  createdAt?: string;
  lastUsedAt?: string;
  isCurrent?: boolean;
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Device name parsing ──────────────────────────────────────────────────────
// The API returns device_info as an object { user_agent, ip_address,
// device_type?, device_name? }, stringifying it shows "[object Object]".
// Derive a human name from the UA when no explicit device_name is set.

function browserFromUA(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "";
}

function osFromUA(ua: string): string {
  if (/Windows NT/.test(ua)) return "Windows";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/Linux/.test(ua)) return "Linux";
  return "";
}

function friendlyDeviceName(ua: string): string {
  const browser = browserFromUA(ua);
  const os = osFromUA(ua);
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || "Unknown device";
}

function parseSession(s: Record<string, unknown>): Session {
  const di = (s.device_info ?? s.deviceInfo) as unknown;
  let ua = "";
  let ip = "";
  let name = "";
  let type = "";

  if (di && typeof di === "object") {
    const d = di as Record<string, unknown>;
    ua = typeof d.user_agent === "string" ? d.user_agent : "";
    ip = typeof d.ip_address === "string" ? d.ip_address : "";
    name = typeof d.device_name === "string" ? d.device_name : "";
    type = typeof d.device_type === "string" ? d.device_type : "";
  } else if (typeof di === "string") {
    ua = di;
  }

  // Older/looser payload shapes
  if (!ua && typeof s.user_agent === "string") ua = s.user_agent;
  if (!ip && typeof s.ip_address === "string") ip = s.ip_address;

  return {
    sessionId: String(s.session_id ?? s.sessionId ?? s._id ?? s.id ?? ""),
    deviceName: name || friendlyDeviceName(ua),
    deviceType: type || (/(iPhone|Android.*Mobile)/.test(ua) ? "mobile" : /iPad|Tablet/.test(ua) ? "tablet" : "desktop"),
    ipAddress: ip,
    createdAt: typeof s.created_at === "string" ? s.created_at : (s.createdAt as string | undefined),
    lastUsedAt: typeof s.last_used_at === "string" ? s.last_used_at : (s.lastUsedAt as string | undefined),
    isCurrent: Boolean(s.is_current ?? s.isCurrent ?? false),
  };
}

function DeviceIcon({ type, className }: { type: string; className?: string }) {
  if (type === "mobile") return <Smartphone className={className} />;
  if (type === "tablet") return <Tablet className={className} />;
  return <Monitor className={className} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("account");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Account
  const [displayName, setDisplayName] = useState(user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.username ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [savingAccount, setSavingAccount] = useState(false);

  // Danger zone
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatePw, setDeactivatePw] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Push notifications
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushChecked, setPushChecked] = useState(false);

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
        setSessions(raw.map(parseSession));
      }
    } catch {
      // non-critical
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "security") void loadSessions();
  }, [tab, loadSessions]);

  useEffect(() => {
    if (tab !== "notifications" || pushChecked) return;
    setPushChecked(true);
    getExistingSubscription()
      .then((sub) => setPushEnabled(Boolean(sub) && Notification.permission === "granted"))
      .catch(() => setPushEnabled(false));
  }, [tab, pushChecked]);

  const saveAccount = async () => {
    setSavingAccount(true);
    try {
      const body: Record<string, string> = {};
      if (displayName.trim()) body.display_name = displayName.trim();
      if (username.trim()) body.username = username.trim();
      const res = await apiPut(AUTH_ENDPOINTS.UPDATE_PROFILE, body);
      if (!res.success) throw new Error((res as { error?: { message?: string } }).error?.message ?? "Update failed");
      showMsg("Account updated. Refresh the page to see changes.");
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Failed to update account.", true);
    } finally {
      setSavingAccount(false);
    }
  };

  const deactivateAccount = async () => {
    if (!deactivatePw) { showMsg("Enter your password to confirm deactivation.", true); return; }
    setDeactivating(true);
    try {
      const res = await apiPost(AUTH_ENDPOINTS.DEACTIVATE_ACCOUNT, { password: deactivatePw });
      if (!res.success) throw new Error((res as { error?: { message?: string } }).error?.message ?? "Deactivation failed");
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Failed to deactivate account.", true);
      setDeactivating(false);
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

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        showMsg("Tournament alerts disabled on this device.");
      } else {
        await subscribeToPush();
        setPushEnabled(true);
        showMsg("Tournament alerts enabled. You'll be notified when tournaments open for your games.");
      }
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Failed to update notification settings.", true);
    } finally {
      setPushBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "account", label: "Account", icon: <UserCog className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <KeyRound className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "payment", label: "Payment", icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" /> Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Private account controls. Your public identity, photo, bio, games, stats, lives on your Profile.
        </p>
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
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t.id ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Account tab */}
      {tab === "account" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <h2 className="font-semibold text-white">Account Information</h2>
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
                <p className="text-[11px] text-slate-600 mt-1">Your public profile URL uses this username.</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Email</label>
                <input value={user?.email ?? ""} disabled
                  className="w-full bg-slate-800/30 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
                <p className="text-[11px] text-slate-600 mt-1">Email cannot be changed.</p>
              </div>
            </div>
            <button onClick={() => { void saveAccount(); }} disabled={savingAccount}
              className="w-full py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingAccount ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-500/25 bg-red-950/10 p-6 space-y-4">
            <h2 className="font-semibold text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h2>
            {!deactivateOpen ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  Deactivating hides your profile and signs you out everywhere. Contact support to reactivate.
                </p>
                <button onClick={() => setDeactivateOpen(true)}
                  className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
                  Deactivate Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Enter your password to confirm deactivation.</p>
                <input type="password" value={deactivatePw} onChange={e => setDeactivatePw(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500" />
                <div className="flex gap-2">
                  <button onClick={() => { void deactivateAccount(); }} disabled={deactivating}
                    className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {deactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {deactivating ? "Deactivating…" : "Confirm Deactivation"}
                  </button>
                  <button onClick={() => { setDeactivateOpen(false); setDeactivatePw(""); }}
                    className="px-4 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <div className="space-y-6">
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

          {/* Active sessions */}
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
                    <DeviceIcon type={s.deviceType} className={`w-5 h-5 mt-0.5 shrink-0 ${s.isCurrent ? "text-cyan-400" : "text-slate-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {s.deviceName}
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
        </div>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <h2 className="font-semibold text-white">Push Notifications</h2>
          {!isPushSupported() ? (
            <p className="text-sm text-slate-400">
              Push notifications are not supported in this browser. On iPhone/iPad, add
              Apex Arenas to your Home Screen first, then enable alerts from there.
            </p>
          ) : getNotificationPermission() === "denied" ? (
            <p className="text-sm text-slate-400">
              Notifications are blocked for this site. Enable them in your browser's
              site settings, then come back here to turn on tournament alerts.
            </p>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">Tournament alerts</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Get notified when a tournament opens for a game you play, even when
                  Apex Arenas is closed. Applies to this browser/device only.
                </p>
              </div>
              <button
                onClick={() => { void togglePush(); }}
                disabled={pushBusy}
                role="switch"
                aria-checked={pushEnabled}
                aria-label="Toggle tournament alerts"
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  pushEnabled ? "bg-cyan-500" : "bg-slate-700"
                }`}
              >
                {pushBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                ) : (
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      pushEnabled ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment tab */}
      {tab === "payment" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="font-semibold text-white">Payout Account</h2>
          <div className="text-center py-8">
            <CreditCard className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-400 mt-4 font-medium">Saved payout details are coming soon</p>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              You'll be able to save your Mobile Money account here so withdrawals don't
              require re-entering details. For now, payout details are collected when you
              request a withdrawal from your Wallet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
