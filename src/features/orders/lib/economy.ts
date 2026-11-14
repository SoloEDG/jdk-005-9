export function levelFor(xp: number) {
  return 1 + Math.floor(xp / 100);
}
export function progressFor(xp: number) {
  return xp % 100;
}
export function salePrice(value: number) {
  return Math.max(1, Math.floor(value * 0.75));
}
