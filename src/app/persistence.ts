const key = "meadow-post-v1";
export function saveFarm(data: unknown) {
  localStorage.setItem(key, JSON.stringify({ version: 1, data }));
}
export function loadFarm<T>(): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { version: number; data: T };
  if (parsed.version !== 1 || !parsed.data) throw new Error("存档版本不支持");
  return parsed.data;
}
