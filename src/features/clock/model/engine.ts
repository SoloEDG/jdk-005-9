import type { Tick } from "../../../shared/contracts";
import { weatherAt } from "../lib/weather";
export function createEngine(
  read: () => number,
  write: (hour: number) => void,
  consume: (tick: Tick) => void,
) {
  let running = false;
  return {
    advance(hours: number) {
      if (running || !Number.isInteger(hours) || hours < 1 || hours > 168)
        return;
      running = true;
      try {
        for (let i = 0; i < hours; i++) {
          const from = read();
          write(from + 1);
          consume({ from, to: from + 1, weather: weatherAt(from) });
        }
      } finally {
        running = false;
      }
    },
  };
}
