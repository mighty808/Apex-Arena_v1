// Sponsor logo strip (spec §5.1), tournament page, bracket header.
// `size` set by the organizer controls prominence.

export interface SponsorDisplay {
  name: string;
  logoUrl: string;
  size: "small" | "medium" | "large";
  websiteUrl?: string;
}

const SIZE_CLASSES: Record<SponsorDisplay["size"], string> = {
  small: "h-8",
  medium: "h-12",
  large: "h-16",
};

export default function SponsorStrip({
  sponsors,
  label = "Sponsored by",
}: {
  sponsors: SponsorDisplay[];
  label?: string;
}) {
  if (sponsors.length === 0) return null;

  return (
    <div>
      {label && (
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold mb-2.5">{label}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {sponsors.map((s, i) => {
          const img = (
            <img
              src={s.logoUrl}
              alt={s.name}
              title={s.name}
              className={`${SIZE_CLASSES[s.size]} w-auto max-w-[140px] object-contain rounded bg-white/95 px-2 py-1`}
            />
          );
          return s.websiteUrl ? (
            <a key={i} href={s.websiteUrl} target="_blank" rel="noopener noreferrer sponsored" className="hover:opacity-80 transition-opacity">
              {img}
            </a>
          ) : (
            <span key={i}>{img}</span>
          );
        })}
      </div>
    </div>
  );
}
