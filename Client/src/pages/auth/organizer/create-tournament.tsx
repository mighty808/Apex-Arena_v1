import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  CalendarDays,
  DollarSign,
  Users,
  Globe,
  AlertCircle,
  ChevronLeft,
  Loader2,
  Image,
} from "lucide-react";
import { organizerService, type CreateTournamentPayload } from "../../../services/organizer.service";
import { apiGet } from "../../../utils/api.utils";
import { TOURNAMENT_ENDPOINTS } from "../../../config/api.config";

// ─── Small UI helpers ────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors";

const selectCls =
  "w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors";

// ─── Component ───────────────────────────────────────────────────────────────

interface GameOption { id: string; name: string }

const CreateTournament = () => {
  const navigate = useNavigate();
  const hasFetchedGames = useRef(false);

  const [games, setGames] = useState<GameOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gameId, setGameId] = useState("");
  const [tournamentType, setTournamentType] = useState("single_elimination");
  const [format, setFormat] = useState("1v1");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [minParticipants, setMinParticipants] = useState("4");
  const [isFree, setIsFree] = useState(true);
  const [entryFee, setEntryFee] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [tournamentStart, setTournamentStart] = useState("");
  const [tournamentEnd, setTournamentEnd] = useState("");
  const [checkInStart, setCheckInStart] = useState("");
  const [checkInEnd, setCheckInEnd] = useState("");
  const [region, setRegion] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [rules, setRules] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    if (hasFetchedGames.current) return;
    hasFetchedGames.current = true;

    apiGet(TOURNAMENT_ENDPOINTS.GAMES).then((res) => {
      if (!res.success) return;
      const raw = res.data as Record<string, unknown>;
      const list = Array.isArray(raw) ? raw : ((raw.games ?? raw.data ?? []) as Record<string, unknown>[]);
      setGames(
        list.map((g) => ({
          id: String((g as Record<string, unknown>)._id ?? ''),
          name: String((g as Record<string, unknown>).name ?? ''),
        }))
      );
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Tournament title is required."); return; }
    if (!gameId) { setError("Please select a game."); return; }
    if (!registrationStart || !registrationEnd || !tournamentStart) {
      setError("Registration start, registration end, and tournament start dates are required.");
      return;
    }
    if (!isFree && !entryFee) { setError("Entry fee is required for paid tournaments."); return; }

    setIsSubmitting(true);
    try {
      const payload: CreateTournamentPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        gameId,
        tournamentType: tournamentType || undefined,
        format: format || undefined,
        isFree,
        entryFee: !isFree && entryFee ? Math.round(parseFloat(entryFee) * 100) : 0,
        currency: "GHS",
        maxParticipants: parseInt(maxParticipants) || 16,
        minParticipants: parseInt(minParticipants) || 4,
        registrationStart,
        registrationEnd,
        tournamentStart,
        tournamentEnd: tournamentEnd || undefined,
        checkInStart: checkInStart || undefined,
        checkInEnd: checkInEnd || undefined,
        prizePool: prizePool ? Math.round(parseFloat(prizePool) * 100) : undefined,
        rules: rules.trim() || undefined,
        region: region.trim() || undefined,
        visibility,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      };

      const created = await organizerService.createTournament(payload);
      navigate(`/auth/organizer/tournaments/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tournament.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/auth/organizer/tournaments")}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Create Tournament</h1>
          <p className="text-sm text-slate-400 mt-0.5">Fill in the details to set up your tournament.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <SectionCard title="Basic Info" icon={Trophy}>
          <Field label="Tournament Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apex Arenas Season 1"
              maxLength={100}
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your tournament (rules, format, prizes, etc.)"
              rows={3}
              maxLength={2000}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Game" required>
              <select value={gameId} onChange={(e) => setGameId(e.target.value)} className={selectCls}>
                <option value="">Select a game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Tournament Type">
              <select value={tournamentType} onChange={(e) => setTournamentType(e.target.value)} className={selectCls}>
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
                <option value="round_robin">Round Robin</option>
                <option value="swiss">Swiss</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Format">
              <select value={format} onChange={(e) => setFormat(e.target.value)} className={selectCls}>
                {["1v1", "2v2", "3v3", "4v4", "5v5", "solo", "squad"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>

            <Field label="Visibility">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={selectCls}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </Field>
          </div>

          <Field label="Region">
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. West Africa, Ghana, Global"
              className={inputCls}
            />
          </Field>

          <Field label="Thumbnail URL">
            <div className="flex gap-2 items-center">
              <Image className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/tournament-banner.png"
                className={inputCls}
              />
            </div>
          </Field>
        </SectionCard>

        {/* Participants */}
        <SectionCard title="Participants" icon={Users}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max Participants" required>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                min={2}
                max={1024}
                className={inputCls}
              />
            </Field>
            <Field label="Min Participants">
              <input
                type="number"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
                min={2}
                className={inputCls}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Schedule */}
        <SectionCard title="Schedule" icon={CalendarDays}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Registration Opens" required>
              <input
                type="datetime-local"
                value={registrationStart}
                onChange={(e) => setRegistrationStart(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Registration Closes" required>
              <input
                type="datetime-local"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Tournament Starts" required>
              <input
                type="datetime-local"
                value={tournamentStart}
                onChange={(e) => setTournamentStart(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Tournament Ends">
              <input
                type="datetime-local"
                value={tournamentEnd}
                onChange={(e) => setTournamentEnd(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Check-In Opens">
              <input
                type="datetime-local"
                value={checkInStart}
                onChange={(e) => setCheckInStart(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Check-In Closes">
              <input
                type="datetime-local"
                value={checkInEnd}
                onChange={(e) => setCheckInEnd(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Entry & Prize */}
        <SectionCard title="Entry Fee & Prize" icon={DollarSign}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFree(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                isFree
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                  : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              Free Entry
            </button>
            <button
              type="button"
              onClick={() => setIsFree(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                !isFree
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                  : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              Paid Entry
            </button>
          </div>

          {!isFree && (
            <Field label="Entry Fee (GHS)" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₵</span>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  className={`${inputCls} pl-7`}
                />
              </div>
            </Field>
          )}

          <Field label="Prize Pool (GHS)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₵</span>
              <input
                type="number"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                className={`${inputCls} pl-7`}
              />
            </div>
          </Field>
        </SectionCard>

        {/* Rules */}
        <SectionCard title="Rules & Info" icon={Globe}>
          <Field label="Rules">
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Tournament rules, code of conduct, map pool, etc."
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </SectionCard>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/auth/organizer/tournaments")}
            className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Create Tournament
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournament;
