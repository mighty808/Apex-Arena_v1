import { Plus, Trash2 } from "lucide-react";
import ImageUploadDropzone from "./ImageUploadDropzone";

// Sponsor upload/layout manager (spec §5) used in the organizer's
// create/edit tournament form. Size controls the logo's prominence on the
// tournament page and share cards.

export interface SponsorDraft {
  name: string;
  logoUrl: string;
  size: "small" | "medium" | "large";
  websiteUrl: string;
}

export const MAX_SPONSORS = 6;

export default function SponsorManager({
  sponsors,
  onChange,
}: {
  sponsors: SponsorDraft[];
  onChange: (next: SponsorDraft[]) => void;
}) {
  const update = (index: number, patch: Partial<SponsorDraft>) => {
    onChange(sponsors.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const remove = (index: number) => {
    onChange(sponsors.filter((_, i) => i !== index));
  };

  const add = () => {
    if (sponsors.length >= MAX_SPONSORS) return;
    onChange([...sponsors, { name: "", logoUrl: "", size: "medium", websiteUrl: "" }]);
  };

  return (
    <div className="space-y-3">
      {sponsors.map((sponsor, i) => (
        <div key={i} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sponsor {i + 1}</p>
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Remove sponsor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-2.5">
            <input
              type="text"
              value={sponsor.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Sponsor name"
              maxLength={60}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70"
            />
            <select
              value={sponsor.size}
              onChange={(e) => update(i, { size: e.target.value as SponsorDraft["size"] })}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/70 appearance-none cursor-pointer [&>option]:bg-slate-800"
            >
              <option value="small">Small logo</option>
              <option value="medium">Medium logo</option>
              <option value="large">Large logo</option>
            </select>
          </div>

          <input
            type="url"
            value={sponsor.websiteUrl}
            onChange={(e) => update(i, { websiteUrl: e.target.value })}
            placeholder="Website (optional), https://…"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/70"
          />

          <ImageUploadDropzone
            value={sponsor.logoUrl}
            onChange={(url) => update(i, { logoUrl: url })}
            folder="apex-arenas/tournaments/sponsors"
          />
        </div>
      ))}

      {sponsors.length < MAX_SPONSORS && (
        <button
          type="button"
          onClick={add}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-700 text-sm text-slate-400 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Sponsor
        </button>
      )}
      <p className="text-[11px] text-slate-600">
        Sponsor logos appear on the tournament page, the bracket, and on all shareable
        cards (summary + player journey cards), up to {MAX_SPONSORS} sponsors.
      </p>
    </div>
  );
}
