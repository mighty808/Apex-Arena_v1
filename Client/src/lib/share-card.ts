import { toPng, toBlob } from 'html-to-image';

// Export a rendered card node as a PNG — download or native share sheet.
// Cards are designed at 1/3 scale (e.g. 360×640 for 9:16) and exported at
// pixelRatio 3 → 1080×1920, Instagram-Story ready (spec §4.2).

const EXPORT_OPTIONS = {
  pixelRatio: 3,
  cacheBust: true,
  // Avatars come from Cloudinary which sends CORS headers; anything that
  // still fails to inline just renders as the fallback initials block.
  skipFonts: false,
};

export async function downloadCardPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, EXPORT_OPTIONS);
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/** True when the browser can share files (mostly mobile). */
export function canNativeShare(): boolean {
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
}

export async function shareCardPng(
  node: HTMLElement,
  filename: string,
  text?: string,
  url?: string
): Promise<boolean> {
  if (!canNativeShare()) return false;
  const blob = await toBlob(node, EXPORT_OPTIONS);
  if (!blob) return false;

  const file = new File([blob], `${filename}.png`, { type: 'image/png' });
  if (!navigator.canShare({ files: [file] })) return false;

  try {
    await navigator.share({ files: [file], text, url });
    return true;
  } catch {
    // User cancelled the share sheet — not an error
    return true;
  }
}
