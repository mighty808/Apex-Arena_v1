// Social links, Phase 6 (new_build.md): users type just their username per
// platform and we construct the public URL ourselves. Full URLs pasted by
// older accounts still work. Discord has no public profile URL, so the
// handle is shown as text instead of a link.

export type SocialPlatform = 'discord' | 'twitter' | 'twitch' | 'youtube';

export const SOCIAL_PLATFORMS: { key: SocialPlatform; label: string; placeholder: string }[] = [
  { key: 'discord', label: 'Discord', placeholder: 'username' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'username' },
  { key: 'twitch', label: 'Twitch', placeholder: 'username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'channel handle' },
];

function stripHandle(value: string): string {
  return value.trim().replace(/^@/, '');
}

/** Public URL for a handle, or null when the platform has none (Discord). */
export function socialUrl(platform: SocialPlatform, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v; // legacy full URLs pass through

  const handle = encodeURIComponent(stripHandle(v));
  switch (platform) {
    case 'twitter': return `https://x.com/${handle}`;
    case 'twitch': return `https://twitch.tv/${handle}`;
    case 'youtube': return `https://youtube.com/@${handle}`;
    case 'discord': return null;
  }
}

/** Display text for a stored value (handle or legacy URL). */
export function socialDisplay(value: string): string {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return `@${stripHandle(v)}`;
  try {
    const url = new URL(v);
    const tail = url.pathname.replace(/\/+$/, '').split('/').pop();
    return tail ? `@${tail.replace(/^@/, '')}` : url.hostname;
  } catch {
    return v;
  }
}
