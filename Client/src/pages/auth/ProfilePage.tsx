import { useCallback, useEffect, useRef, useState } from "react";
import {
  User,
  Camera,
  Save,
  Edit3,
  Lock,
  Globe,
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { authService } from "../../services/auth.service";
import { apiGet, apiPost } from "../../utils/api.utils";
import { AUTH_ENDPOINTS, TOURNAMENT_ENDPOINTS } from "../../config/api.config";
import type { UpdateProfilePayload } from "../../types/auth.types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(first: string, last: string, username: string) {
  const f = first?.[0]?.toUpperCase() ?? "";
  const l = last?.[0]?.toUpperCase() ?? "";
  return f + l || username?.[0]?.toUpperCase() || "?";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-base font-semibold text-white mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
    />
  );
}

function Alert({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm ${
        type === "success"
          ? "bg-green-500/10 border border-green-500/30 text-green-300"
          : "bg-red-500/10 border border-red-500/30 text-red-300"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ProfileForm {
  firstName: string;
  lastName: string;
  bio: string;
  country: string;
  phone: string;
  avatarUrl: string;
  discord: string;
  twitter: string;
  twitch: string;
  youtube: string;
}

interface GameEntry {
  gameId: string;
  gameName: string;
  inGameId: string;
  skillLevel: string;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface GameOption {
  id: string;
  name: string;
}

const ProfilePage = () => {
  const { user, setSession, tokens } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    bio: "",
    country: "",
    phone: "",
    avatarUrl: "",
    discord: "",
    twitter: "",
    twitch: "",
    youtube: "",
  });

  const [games, setGames] = useState<GameEntry[]>([]);
  const [availableGames, setAvailableGames] = useState<GameOption[]>([]);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [passwordAlert, setPasswordAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const hasFetched = useRef(false);

  // Fetch full profile on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const load = async () => {
      try {
        const [profileRes, gamesRes] = await Promise.all([
          apiGet(AUTH_ENDPOINTS.PROFILE),
          apiGet(TOURNAMENT_ENDPOINTS.GAMES),
        ]);

        if (profileRes.success) {
          const raw = profileRes.data as Record<string, unknown>;
          const profile = (raw.profile ?? {}) as Record<string, unknown>;
          const social = (profile.social_links ?? {}) as Record<string, unknown>;
          const gameProfs = (profile.game_profiles ?? []) as Record<string, unknown>[];

          setForm({
            firstName: String(profile.first_name ?? raw.first_name ?? user?.firstName ?? ""),
            lastName: String(profile.last_name ?? raw.last_name ?? user?.lastName ?? ""),
            bio: String(profile.bio ?? ""),
            country: String(profile.country ?? ""),
            phone: String(profile.phone ?? ""),
            avatarUrl: String(profile.avatar_url ?? ""),
            discord: String(social.discord ?? ""),
            twitter: String(social.twitter ?? ""),
            twitch: String(social.twitch ?? ""),
            youtube: String(social.youtube ?? ""),
          });

          setGames(
            gameProfs.map((g) => ({
              gameId: String(g.game_id ?? ""),
              gameName: String((g.game as Record<string, unknown>)?.name ?? g.game_name ?? ""),
              inGameId: String(g.in_game_id ?? ""),
              skillLevel: String(g.skill_level ?? "beginner"),
            }))
          );
        }

        if (gamesRes.success) {
          const raw = gamesRes.data as Record<string, unknown>;
          const list = Array.isArray(raw) ? raw : ((raw.games ?? raw.data ?? []) as Record<string, unknown>[]);
          setAvailableGames(
            list.map((g) => ({ id: String(g._id ?? g.id ?? ""), name: String(g.name ?? "") }))
          );
        }
      } catch {
        // silently fail
      }
    };

    void load();
  }, [user]);

  const setField = useCallback(
    <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    setAlert(null);
    try {
      const payload: UpdateProfilePayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio || undefined,
        country: form.country || undefined,
        phone: form.phone || undefined,
        avatarUrl: form.avatarUrl || undefined,
        discord: form.discord || undefined,
        twitter: form.twitter || undefined,
        twitch: form.twitch || undefined,
        youtube: form.youtube || undefined,
        gameProfiles: games
          .filter((g) => g.gameId && g.inGameId)
          .map((g) => ({
            gameId: g.gameId,
            inGameId: g.inGameId,
            skillLevel: g.skillLevel || undefined,
          })),
      };

      const result = await authService.updateProfile(payload);
      if (result.user && tokens) {
        setSession(tokens, result.user);
      }
      setAlert({ type: "success", msg: "Profile updated successfully." });
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.next) {
      setPasswordAlert({ type: "error", msg: "Please fill in all password fields." });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordAlert({ type: "error", msg: "New passwords do not match." });
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordAlert({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }

    setIsSavingPassword(true);
    setPasswordAlert(null);
    try {
      const response = await apiPost(AUTH_ENDPOINTS.PASSWORD_CHANGE, {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      if (!response.success) {
        const msg = (response as { error?: { message?: string } }).error?.message ?? "Failed to change password.";
        setPasswordAlert({ type: "error", msg });
        return;
      }
      setPasswordAlert({ type: "success", msg: "Password changed successfully." });
      setPasswordForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPasswordAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to change password." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const addGame = () => {
    setGames((prev) => [
      ...prev,
      { gameId: "", gameName: "", inGameId: "", skillLevel: "beginner" },
    ]);
  };

  const updateGame = (index: number, field: keyof GameEntry, value: string) => {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        if (field === "gameId") {
          const found = availableGames.find((ag) => ag.id === value);
          return { ...g, gameId: value, gameName: found?.name ?? "" };
        }
        return { ...g, [field]: value };
      })
    );
  };

  const removeGame = (index: number) => {
    setGames((prev) => prev.filter((_, i) => i !== index));
  };

  const displayName =
    `${form.firstName} ${form.lastName}`.trim() || user?.username || "User";

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
              {initials(form.firstName, form.lastName, user?.username ?? "")}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Camera className="w-3 h-3 text-slate-400" />
          </div>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-sm text-slate-400">
            @{user?.username}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-xs capitalize">
              {user?.role}
            </span>
          </p>
        </div>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
      )}

      {/* Personal Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <SectionTitle>
          <User className="w-4 h-4 text-cyan-400" />
          Personal Info
        </SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name">
            <Input
              value={form.firstName}
              onChange={(v) => setField("firstName", v)}
              placeholder="First name"
            />
          </Field>
          <Field label="Last Name">
            <Input
              value={form.lastName}
              onChange={(v) => setField("lastName", v)}
              placeholder="Last name"
            />
          </Field>
        </div>

        <Field label="Bio">
          <Textarea
            value={form.bio}
            onChange={(v) => setField("bio", v)}
            placeholder="Tell others about yourself (max 500 characters)"
            rows={3}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country">
            <Input
              value={form.country}
              onChange={(v) => setField("country", v)}
              placeholder="e.g. Ghana"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(v) => setField("phone", v)}
              placeholder="e.g. +233 50 000 0000"
            />
          </Field>
        </div>

        <Field label="Avatar URL">
          <Input
            value={form.avatarUrl}
            onChange={(v) => setField("avatarUrl", v)}
            placeholder="https://example.com/your-avatar.png"
          />
        </Field>

        <Field label="Email">
          <Input value={user?.email ?? ""} onChange={() => {}} disabled />
        </Field>
      </div>

      {/* Social Links */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <SectionTitle>
          <Globe className="w-4 h-4 text-cyan-400" />
          Social Links
        </SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              { key: "discord", label: "Discord", placeholder: "Your Discord tag" },
              { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/you" },
              { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/you" },
              { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@you" },
            ] as { key: keyof ProfileForm; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <Input
                value={form[key] as string}
                onChange={(v) => setField(key, v)}
                placeholder={placeholder}
              />
            </Field>
          ))}
        </div>
      </div>

      {/* Game Profiles */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            Game Profiles
          </SectionTitle>
          <button
            onClick={addGame}
            className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Game
          </button>
        </div>

        {games.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No game profiles yet. Add one to show your in-game identity.
          </p>
        ) : (
          <div className="space-y-3">
            {games.map((g, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_auto] sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end"
              >
                <Field label="Game">
                  <select
                    value={g.gameId}
                    onChange={(e) => updateGame(i, "gameId", e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="">Select game</option>
                    {availableGames.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="In-Game ID">
                  <Input
                    value={g.inGameId}
                    onChange={(v) => updateGame(i, "inGameId", v)}
                    placeholder="Your in-game username"
                  />
                </Field>

                <Field label="Skill Level">
                  <select
                    value={g.skillLevel}
                    onChange={(e) => updateGame(i, "skillLevel", e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {["beginner", "intermediate", "advanced", "pro"].map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>

                <button
                  onClick={() => removeGame(i)}
                  className="mb-0.5 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-60 transition-colors"
        >
          {isSaving ? (
            <div className="h-4 w-4 rounded-full border-2 border-slate-950/40 border-t-transparent animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <SectionTitle>
          <Lock className="w-4 h-4 text-cyan-400" />
          Change Password
        </SectionTitle>

        {passwordAlert && (
          <Alert
            type={passwordAlert.type}
            message={passwordAlert.msg}
            onClose={() => setPasswordAlert(null)}
          />
        )}

        <div className="space-y-3">
          <Field label="Current Password">
            <Input
              type="password"
              value={passwordForm.current}
              onChange={(v) => setPasswordForm((p) => ({ ...p, current: v }))}
              placeholder="Enter current password"
            />
          </Field>
          <Field label="New Password">
            <Input
              type="password"
              value={passwordForm.next}
              onChange={(v) => setPasswordForm((p) => ({ ...p, next: v }))}
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm New Password">
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(v) => setPasswordForm((p) => ({ ...p, confirm: v }))}
              placeholder="Repeat new password"
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={isSavingPassword}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 disabled:opacity-60 transition-colors"
          >
            {isSavingPassword ? (
              <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
            {isSavingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
