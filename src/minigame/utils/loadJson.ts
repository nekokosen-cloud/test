/** 兼容 webpack 打包 JSON：module.exports 直接是数据，无 .default */
export function loadJsonArray<T>(mod: unknown): T[] {
  if (Array.isArray(mod)) return mod as T[];
  if (mod && typeof mod === 'object') {
    const rec = mod as Record<string, unknown>;
    if (Array.isArray(rec.default)) return rec.default as T[];
  }
  return [];
}

export function loadJson<T>(mod: unknown): T {
  if (mod && typeof mod === 'object' && !Array.isArray(mod)) {
    const rec = mod as Record<string, unknown>;
    if ('default' in rec && rec.default !== undefined) return rec.default as T;
  }
  return mod as T;
}
