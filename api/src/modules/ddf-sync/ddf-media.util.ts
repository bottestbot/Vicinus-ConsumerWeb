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
