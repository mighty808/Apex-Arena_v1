// Shared visual pieces for share-card templates. All cards are rendered at
// design size (360px wide) and exported at 3× → 1080px. Keep everything
// self-contained (no external images beyond avatars) so html-to-image can
// rasterise it reliably.

export function CardBackground() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 90% 60% at 80% -10%, rgba(249,115,22,0.28), transparent)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 0% 110%, rgba(139,92,246,0.16), transparent)" }}
      />
    </>
  );
}

export function ApexBranding() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <img src="/apex-logo.png" alt="" className="w-4 h-4 rounded bg-white p-px" crossOrigin="anonymous" />
      <span className="font-display text-[10px] font-bold tracking-widest text-slate-400 uppercase">
        Apex Arenas
      </span>
    </div>
  );
}

// Sponsor logos on shareable cards (spec §5.2) — organizer-set size controls
// prominence within the fixed layout. Renders nothing when no sponsors.
export function CardSponsorRow({
  sponsors,
}: {
  sponsors?: { name: string; logo_url: string; size: "small" | "medium" | "large" }[];
}) {
  if (!sponsors || sponsors.length === 0) return null;

  const heights: Record<string, number> = { small: 14, medium: 18, large: 24 };

  return (
    <div className="flex items-center justify-center gap-2.5 flex-wrap">
      <span className="text-[7px] text-slate-500 uppercase tracking-[0.18em]">Sponsored by</span>
      {sponsors.slice(0, 4).map((s, i) => (
        <img
          key={i}
          src={s.logo_url}
          alt={s.name}
          crossOrigin="anonymous"
          className="w-auto max-w-[70px] object-contain rounded-sm bg-white/95 px-1 py-0.5"
          style={{ height: heights[s.size] ?? 18 }}
        />
      ))}
    </div>
  );
}

export function CardAvatar({
  url,
  fallback,
  size = 64,
}: {
  url?: string;
  fallback: string;
  size?: number;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden border-2 border-orange-500/40 bg-slate-800 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
      ) : (
        <span className="font-display font-bold text-white" style={{ fontSize: size / 2.4 }}>
          {fallback}
        </span>
      )}
    </div>
  );
}
