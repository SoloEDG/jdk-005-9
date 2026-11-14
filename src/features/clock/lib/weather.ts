import type { Weather } from "../../../shared/contracts";
export const weatherAt = (hour: number): Weather =>
  (["sun", "rain", "wind", "sun"] as Weather[])[Math.floor(hour / 24) % 4]!;
export const weatherInfo = {
  sun: { name: "晴朗", icon: "☀", description: "阳光充沛 · 蒸发较快" },
  rain: { name: "小雨", icon: "☂", description: "雨水自动滋润土地" },
  wind: { name: "大风", icon: "≋", description: "生长减缓 · 注意浇水" },
};
