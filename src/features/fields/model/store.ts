import { reactive, readonly } from "vue";
import type {
  Item,
  Plot,
  Tick,
  Notice,
  SeedChoice,
  Traits,
} from "../../../shared/contracts";
import { crops, grow, ready, flowering } from "../lib/crops";
interface SeedPorts {
  spend: (amount: number) => boolean;
  takeSeed: (
    stock: string,
  ) => ({ variety: string; item: Item } & Traits) | null;
  keepSeeds: (variety: string, n: number, hour: number) => void;
}
export function createFields(
  ports: SeedPorts,
  harvest: (item: Item, n: number, q: number, variety?: string) => void,
  notice: Notice,
) {
  const state = reactive({
    plots: Array.from({ length: 12 }, (_, id): Plot => ({ id, crop: null })),
    selected: { kind: "wild", item: "carrot" } as SeedChoice,
  });
  return {
    state: readonly(state),
    select: (choice: SeedChoice) => {
      state.selected = choice;
    },
    plant(id: number, hour: number) {
      const plot = state.plots[id];
      if (!plot || plot.crop) return;
      const choice = state.selected;
      if (choice.kind === "wild") {
        const seed = crops[choice.item];
        if (!seed) return;
        if (!ports.spend(seed.cost)) {
          notice("资金不足，交付订单或出售库存后再试");
          return;
        }
        plot.crop = {
          item: choice.item,
          planted: hour,
          growth: 0,
          water: 70,
          stress: 0,
          harvests: 0,
          pollenBy: null,
          pollenUsed: false,
        };
        notice("种下了新的希望");
        return;
      }
      const stock = ports.takeSeed(choice.stock);
      if (!stock) {
        state.selected = { kind: "wild", item: "carrot" };
        notice("这份种子已经用完了");
        return;
      }
      plot.crop = {
        item: stock.item,
        planted: hour,
        growth: 0,
        water: 70,
        stress: 0,
        harvests: 0,
        variety: stock.variety,
        traits: { drought: stock.drought, speed: stock.speed },
        pollenBy: null,
        pollenUsed: false,
      };
      notice("播下了自育品种的种子");
    },
    water(id: number) {
      const c = state.plots[id]?.crop;
      if (c) c.water = 100;
    },
    harvest(id: number, mode: "produce" | "seed" = "produce", hour = 0) {
      const plot = state.plots[id],
        crop = plot?.crop;
      if (!crop || !ready(crop)) return;
      const def = crops[crop.item]!;
      if (mode === "seed" && crop.variety) {
        ports.keepSeeds(crop.variety, def.yield, hour);
        notice("收成已留种，收入种子匣");
      } else {
        harvest(crop.item, def.yield, crop.stress <= 2 ? 2 : 1, crop.variety);
        notice("收获已按品质分批入仓");
      }
      if (crop.harvests < def.repeat) {
        crop.growth = 0;
        crop.harvests++;
        crop.pollenBy = null;
        crop.pollenUsed = false;
      } else plot.crop = null;
    },
    remove(id: number) {
      const plot = state.plots[id];
      if (!plot?.crop) return;
      plot.crop = null;
      notice("已摘除这株作物，土地腾空");
    },
    occupy(plot: number, cross: string) {
      const c = state.plots[plot]?.crop;
      if (!c || !flowering(c) || c.pollenBy || c.pollenUsed) return false;
      c.pollenBy = cross;
      return true;
    },
    release(cross: string) {
      for (const plot of state.plots)
        if (plot.crop?.pollenBy === cross) plot.crop.pollenBy = null;
    },
    consumePollen(plot: number, cross: string) {
      const c = state.plots[plot]?.crop;
      if (c && c.pollenBy === cross) {
        c.pollenBy = null;
        c.pollenUsed = true;
      }
    },
    tick(tick: Tick) {
      for (const plot of state.plots)
        if (plot.crop)
          plot.crop = grow(plot.crop, tick.weather, tick.to - tick.from);
    },
    snapshot: () => JSON.parse(JSON.stringify(state)) as typeof state,
    restore: (data: typeof state) => {
      const raw = data as { selected?: SeedChoice | Item };
      if (typeof raw.selected === "string")
        raw.selected = { kind: "wild", item: raw.selected };
      Object.assign(state, data);
    },
  };
}
