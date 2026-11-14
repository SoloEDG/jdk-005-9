import { reactive, readonly } from "vue";
import type {
  BreedingOrder,
  Cross,
  CrossRef,
  Item,
  Notice,
  Plot,
  SeedStock,
  Traits,
  Variety,
} from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { flowering } from "../../fields/lib/crops";
import {
  CROSS_HOURS,
  SEEDS_PER_CROSS,
  WILD_TRAITS,
  offspring,
  lineageOf,
  wildIdentity,
  traitLabel,
} from "../lib/genetics";
import {
  breedingOrder,
  initialBreedingOrders,
  matchingStocks,
  suggestName,
} from "../lib/breeding";
interface FieldsPort {
  state: { plots: readonly Readonly<Plot>[] };
  occupy: (plot: number, cross: string) => boolean;
  release: (cross: string) => void;
  consumePollen: (plot: number, cross: string) => void;
}
export function createBreeding(
  fields: FieldsPort,
  earn: (n: number) => void,
  notice: Notice,
  hour: number,
) {
  const state = reactive({
    varieties: [] as Variety[],
    stocks: [] as SeedStock[],
    crosses: [] as Cross[],
    orders: initialBreedingOrders(hour) as BreedingOrder[],
    serial: 2,
    draft: { a: null as number | null, b: null as number | null },
  });
  const cropAt = (plot: number) => fields.state.plots[plot]?.crop ?? null;
  const identityOf = (plot: number): string => {
    const c = cropAt(plot);
    return c?.variety ?? wildIdentity(c?.item ?? "");
  };
  const traitsOf = (plot: number): Traits =>
    cropAt(plot)?.traits ?? WILD_TRAITS;
  const varietyName = (id: string) =>
    state.varieties.find((v) => v.id === id)?.name ?? "未知品种";
  const labelOf = (plot: number): string => {
    const c = cropAt(plot);
    if (!c) return "空地";
    return c.variety ? varietyName(c.variety) : `野生${items[c.item].name}`;
  };
  const signatureOf = (plot: number) => {
    const c = cropAt(plot);
    return c ? `${plot}:${c.planted}:${c.harvests}` : null;
  };
  const refOf = (plot: number): CrossRef | null =>
    signatureOf(plot) === null
      ? null
      : {
          plot,
          signature: signatureOf(plot)!,
          identity: identityOf(plot),
          label: labelOf(plot),
        };
  const dropCross = (cross: Cross, message: string) => {
    fields.release(cross.id);
    state.crosses = state.crosses.filter((x) => x.id !== cross.id);
    notice(message);
  };
  return {
    state: readonly(state),
    varietyName,
    choose(slot: "a" | "b", plot: number) {
      const c = cropAt(plot);
      if (!c || !flowering(c)) {
        notice("这株作物还没到开花期");
        return;
      }
      if (c.pollenBy) {
        notice("这株作物正在授粉，花粉已被占用");
        return;
      }
      if (c.pollenUsed) {
        notice("本轮已经取过这株的花粉了");
        return;
      }
      const other = slot === "a" ? state.draft.b : state.draft.a;
      if (other === plot) {
        notice("杂交需要两株不同的作物");
        return;
      }
      if (other !== null) {
        const o = cropAt(other);
        if (o && o.item !== c.item) {
          notice("只有同种作物才能杂交");
          return;
        }
      }
      state.draft[slot] = plot;
    },
    drop: (slot: "a" | "b") => {
      state.draft[slot] = null;
    },
    start(hour: number) {
      const { a, b } = state.draft;
      if (a === null || b === null) {
        notice("先选定两株开花中的亲本");
        return;
      }
      const ra = refOf(a),
        rb = refOf(b);
      if (!ra || !rb) {
        state.draft = { a: null, b: null };
        notice("亲本已不在田里，请重新选择");
        return;
      }
      const id = `x${++state.serial}`;
      if (!fields.occupy(a, id) || !fields.occupy(b, id)) {
        fields.release(id);
        notice("花粉此刻不可用，请重新选择亲本");
        return;
      }
      const traits = offspring(
        ra.identity,
        traitsOf(a),
        rb.identity,
        traitsOf(b),
      );
      state.crosses.push({
        id,
        a: ra,
        b: rb,
        item: cropAt(a)!.item,
        drought: traits.drought,
        speed: traits.speed,
        finish: hour + CROSS_HOURS,
        status: "growing",
      });
      state.draft = { a: null, b: null };
      notice(`开始杂交，预计 ${CROSS_HOURS} 小时后完成`);
    },
    cancel(id: string) {
      const cross = state.crosses.find((x) => x.id === id);
      if (!cross || cross.status !== "growing") return;
      dropCross(cross, "杂交已取消，占用的花粉已释放");
    },
    cancelForPlot(plot: number) {
      for (const cross of [...state.crosses])
        if (
          cross.status === "growing" &&
          (cross.a.plot === plot || cross.b.plot === plot)
        )
          dropCross(cross, "亲本被摘除或收获，未完成的杂交已取消");
    },
    tick(hour: number) {
      for (const cross of [...state.crosses]) {
        if (cross.status !== "growing") continue;
        const a = cropAt(cross.a.plot),
          b = cropAt(cross.b.plot);
        if (
          signatureOf(cross.a.plot) !== cross.a.signature ||
          signatureOf(cross.b.plot) !== cross.b.signature ||
          a?.pollenBy !== cross.id ||
          b?.pollenBy !== cross.id
        ) {
          dropCross(cross, "亲本状态改变，未完成的杂交已取消");
          continue;
        }
        if (cross.finish <= hour) {
          fields.consumePollen(cross.a.plot, cross.id);
          fields.consumePollen(cross.b.plot, cross.id);
          cross.status = "done";
          notice("杂交完成，登记品种后即可收获种子");
        }
      }
      for (const order of state.orders)
        if (order.status === "open" && order.deadline <= hour)
          order.status = "expired";
    },
    register(id: string, name: string, hour: number) {
      const cross = state.crosses.find((x) => x.id === id);
      if (!cross || cross.status !== "done") return;
      const lineage = lineageOf(cross.a.identity, cross.b.identity);
      const parents: [string, string] = [cross.a.label, cross.b.label];
      const existing = state.varieties.find(
        (v) =>
          v.item === cross.item &&
          v.drought === cross.drought &&
          v.speed === cross.speed &&
          v.lineage.join() === lineage.join(),
      );
      const variety: Variety = existing ?? {
        id: `v${++state.serial}`,
        name:
          name.trim() || suggestName(cross.item, state.varieties.length),
        item: cross.item,
        parents,
        lineage,
        drought: cross.drought,
        speed: cross.speed,
        created: hour,
      };
      if (!existing) state.varieties.push(variety);
      state.stocks.push({
        id: `s${++state.serial}`,
        variety: variety.id,
        item: variety.item,
        quantity: SEEDS_PER_CROSS,
        parents,
        drought: variety.drought,
        speed: variety.speed,
        created: hour,
      });
      state.crosses = state.crosses.filter((x) => x.id !== id);
      notice(
        existing
          ? `性状与「${existing.name}」一致，种子 ×${SEEDS_PER_CROSS} 已归入该品种`
          : `新品种「${variety.name}」登记成功，种子 ×${SEEDS_PER_CROSS} 已入种子匣`,
      );
    },
    takeSeed(stock: string) {
      const s = state.stocks.find((s) => s.id === stock);
      if (!s || s.quantity <= 0) return null;
      s.quantity--;
      if (!s.quantity)
        state.stocks = state.stocks.filter((x) => x.id !== stock);
      return {
        variety: s.variety,
        item: s.item,
        drought: s.drought,
        speed: s.speed,
      };
    },
    keepSeeds(variety: string, n: number, hour: number) {
      const v = state.varieties.find((v) => v.id === variety);
      if (!v) return;
      state.stocks.push({
        id: `s${++state.serial}`,
        variety: v.id,
        item: v.item,
        quantity: n,
        parents: v.parents,
        drought: v.drought,
        speed: v.speed,
        created: hour,
      });
    },
    fulfill(id: string, hour: number) {
      const order = state.orders.find((o) => o.id === id);
      if (!order || order.status !== "open") return;
      const usable = matchingStocks(state.stocks, order);
      if (usable.reduce((n, s) => n + s.quantity, 0) < order.quantity) {
        notice(
          `符合要求的种子不足：需要${items[order.item].name}种子 ×${order.quantity}（${traitLabel({ drought: order.minDrought, speed: order.minSpeed })}以上）`,
        );
        return;
      }
      let need = order.quantity;
      for (const s of usable) {
        const take = Math.min(need, s.quantity);
        s.quantity -= take;
        need -= take;
        if (!need) break;
      }
      state.stocks = state.stocks.filter((s) => s.quantity > 0);
      order.status = "done";
      earn(order.reward);
      state.orders.push(breedingOrder(++state.serial, hour));
      notice(`育种订单交付成功，收入 ¥${order.reward}`);
    },
    pickVariety() {
      if (!state.varieties.length) return null;
      const v =
        state.varieties[Math.floor(Math.random() * state.varieties.length)]!;
      return { id: v.id, item: v.item as Item };
    },
    snapshot: () => JSON.parse(JSON.stringify(state)) as typeof state,
    restore: (data: typeof state) => {
      Object.assign(state, data);
    },
  };
}
