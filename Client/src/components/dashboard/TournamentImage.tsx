import { useState } from "react";
import { Gamepad2 } from "lucide-react";
import type { TournamentRegistration } from "../../services/dashboard.service";

type TournamentImageProps = {
  reg: TournamentRegistration;
  className?: string;
};

export default function TournamentImage({
  reg,
  className,
}: TournamentImageProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl =
    reg.tournamentThumbnailUrl ?? reg.tournamentBannerUrl ?? reg.gameLogoUrl;

  if (!imageUrl || hasImageError) {
    return (
      <div
        className={`rounded-lg border border-slate-700 bg-slate-800/70 flex items-center justify-center text-slate-500 ${className ?? "w-12 h-12"}`}
      >
        <Gamepad2 className="w-4 h-4" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={reg.tournamentTitle}
      className={`rounded-lg border border-slate-700 object-cover ${className ?? "w-12 h-12"}`}
      onError={() => setHasImageError(true)}
    />
  );
}
