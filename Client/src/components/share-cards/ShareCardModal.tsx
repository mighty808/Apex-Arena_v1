import { useRef, useState, type PropsWithChildren } from "react";
import { Download, Link2, Loader2, Share2, X } from "lucide-react";
import { canNativeShare, downloadCardPng, shareCardPng } from "../../lib/share-card";
import { showError, showSuccess } from "../../utils/toast.utils";

// Hosts any share-card template: live preview (scaled to fit) + Download /
// Share actions. The template renders at design size inside `cardRef`;
// html-to-image exports it at 3× (spec §4.2 — story-ready PNGs).

export default function ShareCardModal({
  open,
  onClose,
  filename,
  shareText,
  shareUrl,
  children,
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  filename: string;
  shareText?: string;
  /** Public URL this card points at (also encoded in the card's QR, if any). */
  shareUrl?: string;
}>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  if (!open) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setBusy("download");
    try {
      await downloadCardPng(cardRef.current, filename);
      showSuccess("Card downloaded.");
    } catch {
      showError("Failed to generate the card image.");
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setBusy("share");
    try {
      const shared = await shareCardPng(cardRef.current, filename, shareText, shareUrl);
      if (!shared) {
        // Desktop browsers mostly can't share files — fall back to download
        await downloadCardPng(cardRef.current, filename);
        showSuccess("Sharing isn't supported here — card downloaded instead.");
      }
    } catch {
      showError("Failed to share the card.");
    } finally {
      setBusy(null);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSuccess("Link copied.");
    } catch {
      showError("Failed to copy the link.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-6 mb-3">
          <h3 className="font-display text-sm font-bold text-white">Share Card</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card at design size — this exact node gets exported */}
        <div className="rounded-xl overflow-hidden border border-slate-800 w-fit mx-auto">
          <div ref={cardRef}>{children}</div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => void handleDownload()}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-linear-to-r from-orange-500 to-amber-400 text-slate-950 text-sm font-bold hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 transition-all"
          >
            {busy === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PNG
          </button>
          {canNativeShare() && (
            <button
              onClick={() => void handleShare()}
              disabled={busy !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Share
            </button>
          )}
          {shareUrl && (
            <button
              onClick={() => void handleCopyLink()}
              disabled={busy !== null}
              title={shareUrl}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-colors"
            >
              <Link2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
