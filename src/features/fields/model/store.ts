import { reactive, readonly } from "vue";
import type { Item, Plot, Tick, Notice } from "../../../shared/contracts";
import { crops, grow, ready } from "../lib/crops";
export function createFields(
  spend: (amount: number) => boolean,
  harvest: (item: Item, n: number, q: number) => void,
  notice: Notice,
) {
  const state = reactive({
    plots: Array.from({ length: 12 }, (_, id): Plot => ({ id, crop: null })),
    selected: "carrot" as Item,
  });
  return {
    state: readonly(state),
    select: (item: Item) => {
      state.selected = item;
    },
    plant(id: number, hour: number) {
      const plot = state.plots[id],
        seed = crops[state.selected];
      if (!plot || plot.crop || !seed) return;
      if (!spend(seed.cost)) {
        notice("资金不足，交付订单或出售库存后再试");
        return;
      }
      plot.crop = {
        item: state.selected,
        planted: hour,
        growth: 0,
        water: 70,
        stress: 0,
        harvests: 0,
      };
      notice("种下了新的希望");
    },
    water(id: number) {
      const c = state.plots[id]?.crop;
      if (c) c.water = 100;
    },
    harvest(id: number) {
      const plot = state.plots[id],
        crop = plot?.crop;
      if (!crop || !ready(crop)) return;
      const def = crops[crop.item]!;
      harvest(crop.item, def.yield, crop.stress <= 2 ? 2 : 1);
      if (crop.harvests < def.repeat) {
        crop.growth = 0;
        crop.harvests++;
      } else plot.crop = null;
      notice("收获已按品质分批入仓");
    },
    tick(tick: Tick) {
      for (const plot of state.plots)
        if (plot.crop)
          plot.crop = grow(plot.crop, tick.weather, tick.to - tick.from);
    },
    snapshot: () => JSON.parse(JSON.stringify(state)) as typeof state,
    restore: (data: typeof state) => {
      Object.assign(state, data);
    },
  };
}
