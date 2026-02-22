/**
 * Transforms a Cloudinary URL to auto-convert non-browser-safe formats
 * (HEIC, TIFF, BMP, RAW) and optimise quality/format automatically.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function transformCloudinaryUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  // Strip non-browser-safe extensions so f_auto picks the right format
  let transformed = url.replace(/\.(heic|heif|tiff?|bmp|raw)$/i, '');
  // Inject f_auto,q_auto after /upload/ (avoid double-injecting)
  if (!transformed.includes('/upload/f_auto')) {
    transformed = transformed.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return transformed;
}
