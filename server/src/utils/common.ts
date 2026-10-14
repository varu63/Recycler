export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function idOf(value: unknown): string {
  if (value && typeof value === 'object' && '_id' in (value as any)) {
    return String((value as any)._id);
  }
  if (value && typeof value === 'object' && 'id' in (value as any)) {
    return String((value as any).id);
  }
  return String(value);
}

export function isObjectIdLike(value: unknown): boolean {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

export function asBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase();
  if (['true', '1', 'yes'].includes(s)) return true;
  if (['false', '0', 'no'].includes(s)) return false;
  return undefined;
}
