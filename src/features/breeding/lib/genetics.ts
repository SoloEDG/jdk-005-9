import type { Traits } from "../../../shared/contracts";
export const CROSS_HOURS = 12;
export const SEEDS_PER_CROSS = 3;
export const WILD_TRAITS: Traits = { drought: 1, speed: 1 };
export const wildIdentity = (item: string) => `wild:${item}`;
function fnv1a(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/**
 * 遗传结果只由亲本身份决定：同一对亲本永远得到同样的性状，
 * 保存重开、切换面板都不会重抽。
 */
export function offspring(
  identityA: string,
  a: Traits,
  identityB: string,
  b: Traits,
): Traits {
  const key = [identityA, identityB].sort().join("+");
  const rand = mulberry32(fnv1a(key));
  const roll = (x: number, y: number) => {
    const base = Math.round((x + y) / 2);
    const mutation = rand() < 0.4 ? (rand() < 0.5 ? -1 : 1) : 0;
    return Math.max(1, Math.min(3, base + mutation));
  };
  return { drought: roll(a.drought, b.drought), speed: roll(a.speed, b.speed) };
}
export const lineageOf = (identityA: string, identityB: string) =>
  [identityA, identityB].sort() as [string, string];
const numerals = ["Ⅰ", "Ⅱ", "Ⅲ"];
export const traitLabel = (traits: Traits) =>
  `耐旱${numerals[traits.drought - 1] ?? traits.drought} · 速生${
    numerals[traits.speed - 1] ?? traits.speed
  }`;
