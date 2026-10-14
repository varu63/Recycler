export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidImageMime(mime: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mime.toLowerCase());
}

export function isValidImageExt(ext: string): boolean {
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase());
}
