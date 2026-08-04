// DDF's Media resource mixes photos in with non-photo entries (video tour
// links, virtual tour embeds, floor plans, …) under the same array. Consumers
// that map Media straight into a photo gallery must filter these out first —
// otherwise a YouTube/virtual-tour URL renders as a broken image in the grid.
const NON_PHOTO_CATEGORIES = new Set([
  'Video Tour Website',
  'Virtual Tour Website',
]);

export function isPhotoMedia(m: Record<string, unknown>): boolean {
  const category = (m['MediaCategory'] as string | null) ?? '';
  if (NON_PHOTO_CATEGORIES.has(category)) return false;
  const url = (m['MediaURL'] as string | null) ?? '';
  if (/youtu(\.be|be\.com)|vimeo\.com/i.test(url)) return false;
  return true;
}

// ─── Playable video ───────────────────────────────────────────────────────────

/**
 * A listing video the feed can actually play.
 *
 * `MediaCategory: 'Video Tour Website'` is a catch-all — measured against the
 * live BC feed (11,728 active Metro Vancouver listings, 2026-08-03) only ~47%
 * of it is video at all. The rest is Matterport/iGuide spatial tours (840) and
 * agent or tour-platform landing pages (1,189), neither of which can be played
 * inline. So the category alone is not a usable signal; we classify by host and
 * keep only what an <iframe>/<video> can render:
 *
 *   YouTube  1,499 listings   Vimeo  299   direct file  63
 *
 * Anything else stays out — a card that can't play its media is worse than no
 * card at all.
 */
export type ListingVideoKind = 'youtube' | 'vimeo' | 'file';

export interface ListingVideo {
  kind: ListingVideoKind;
  /** Player id — YouTube's 11-char id, or Vimeo's numeric id. Unset for `file`. */
  id?: string;
  /** Vimeo unlisted-video hash (`vimeo.com/<id>/<hash>`); required to embed it. */
  hash?: string;
  /** Playable URL. For `file`, already rewritten to a streamable host. */
  url: string;
}

/** DDF's catch-all MediaCategory for tours; also used as a search filter. */
export const VIDEO_TOUR_CATEGORY = 'Video Tour Website';
const VIDEO_FILE_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

/** Pull the 11-char video id out of any common YouTube URL shape. */
function parseYoutube(raw: string): ListingVideo | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/, // watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, // /embed/ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, // /shorts/ID
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m) return { kind: 'youtube', id: m[1], url: raw };
  }
  return null;
}

/**
 * Parse a Vimeo share URL into its player id (+ hash for unlisted videos).
 *
 * Agents paste the share link, which comes in two shapes: `vimeo.com/<id>` for
 * public videos and `vimeo.com/<id>/<hash>` for unlisted ones. The hash is not
 * optional on the latter — `player.vimeo.com/video/<id>` alone 401s for those.
 */
function parseVimeo(raw: string): ListingVideo | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!/(^|\.)vimeo\.com$/i.test(u.hostname)) return null;

  if (/^player\./i.test(u.hostname)) {
    const m = u.pathname.match(/\/video\/(\d+)/);
    if (!m) return null;
    const h = u.searchParams.get('h');
    return { kind: 'vimeo', id: m[1], ...(h ? { hash: h } : {}), url: raw };
  }

  const [id, maybeHash] = u.pathname.split('/').filter(Boolean);
  if (!/^\d+$/.test(id ?? '')) return null;
  const hash = /^[a-f0-9]{6,}$/i.test(maybeHash ?? '') ? maybeHash : undefined;
  return { kind: 'vimeo', id, ...(hash ? { hash } : {}), url: raw };
}

/**
 * Accept a URL that points straight at a video file.
 *
 * Dropbox is 58 of the 63 in the BC feed, and its share link (`www.dropbox.com/
 * …?dl=0`) serves an HTML preview page, not the file — <video> shows nothing.
 * Swapping the host for `dl.dropboxusercontent.com` and forcing `raw=1` returns
 * the real stream (verified: HTTP 206, `content-type: video/mp4`,
 * `accept-ranges: bytes`).
 *
 * Folder shares (`/scl/fo/`, 6 listings) have no such raw form — the rewrite
 * yields a 404 — so they're rejected rather than shipped as a dead card.
 */
function parseVideoFile(raw: string): ListingVideo | null {
  if (!VIDEO_FILE_RE.test(raw)) return null;

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }

  const isDropbox = /(^|\.)dropbox\.com$|(^|\.)dropboxusercontent\.com$/i.test(
    u.hostname,
  );
  if (isDropbox) {
    if (u.pathname.startsWith('/scl/fo/')) return null;
    u.hostname = 'dl.dropboxusercontent.com';
    u.searchParams.delete('dl');
    u.searchParams.set('raw', '1');
    return { kind: 'file', url: u.toString() };
  }

  return { kind: 'file', url: raw };
}

/**
 * Best playable video for a listing, or null.
 *
 * Ordered by player quality, not by Media `Order`: YouTube and Vimeo give us a
 * real player (buffering, seek, captions) while a raw file is at the mercy of
 * whatever host the agent used. Only 57 of 3,978 listings carry more than one
 * video row, so the ordering rarely decides anything.
 */
export function extractListingVideo(
  media: Record<string, unknown>[],
): ListingVideo | null {
  const urls = media
    .filter(
      (m) =>
        ((m['MediaCategory'] as string | null) ?? '') === VIDEO_TOUR_CATEGORY,
    )
    .map((m) => (m['MediaURL'] as string | null) ?? '')
    .filter(Boolean);

  for (const parse of [parseYoutube, parseVimeo, parseVideoFile]) {
    for (const url of urls) {
      const video = parse(url);
      if (video) return video;
    }
  }
  return null;
}
