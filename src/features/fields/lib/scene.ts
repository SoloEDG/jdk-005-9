import type { Plot } from "../../../shared/contracts";
import { crops } from "./crops";
export function growthStage(plot: Readonly<Plot>) {
  if (!plot.crop) return 0;
  return Math.min(
    3,
    1 + Math.floor(plot.crop.growth / (crops[plot.crop.item]!.duration / 3)),
  );
}
export const sceneTrees = Array.from({ length: 8 }, (_, i) => ({
  left: `${i * 13 + 1}%`,
  top: `${i % 2 ? 4 : 0}px`,
  scale: 1 + (i % 3) * 0.12,
}));
