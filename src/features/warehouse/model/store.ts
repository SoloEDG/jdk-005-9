import { reactive, readonly } from "vue";
import type {
  Item,
  Batch,
  Reservation,
  Notice,
  Receipt,
} from "../../../shared/contracts";
import { allocate, available } from "../lib/allocation";
import { makeBatch } from "../lib/storage";
export function createWarehouse(now: () => number, notice: Notice) {
  const state = reactive({
    batches: [] as Batch[],
    reservations: [] as Reservation[],
    serial: 0,
    wasted: 0,
  });
  const add = (
    item: Item,
    n: number,
    q = 1,
    hour = now(),
    source = "田间收获",
  ) => {
    state.batches.push(
      makeBatch(item, n, q, hour, `b${++state.serial}`, source),
    );
  };
  add("carrot", 8, 2);
  add("berry", 6, 2);
  add("corn", 8, 1);
  return {
    state: readonly(state),
    add,
    free: (id: string) => {
      const b = state.batches.find((b) => b.id === id);
      return b ? available(b, state.reservations) : 0;
    },
    reserve(owner: string, item: Item, n: number, minQuality = 1) {
      const allocations = allocate(
        state.batches,
        state.reservations,
        item,
        n,
        now(),
        minQuality,
      );
      if (!allocations) return null;
      const id = `r${++state.serial}`;
      state.reservations.push({ id, owner, allocations });
      return id;
    },
    consume(id: string) {
      const r = state.reservations.find((r) => r.id === id);
      if (!r) return null;
      for (const a of r.allocations) {
        const b = state.batches.find((b) => b.id === a.batch);
        if (!b || b.quantity < a.quantity || b.expires <= now()) return null;
      }
      const receipt: Receipt = {
        quality: Math.min(
          ...r.allocations.map(
            (a) => state.batches.find((b) => b.id === a.batch)!.quality,
          ),
        ),
        sources: r.allocations.map(
          (a) => state.batches.find((b) => b.id === a.batch)!.source,
        ),
        quantity: r.allocations.reduce((n, a) => n + a.quantity, 0),
      };
      for (const a of r.allocations)
        state.batches.find((b) => b.id === a.batch)!.quantity -= a.quantity;
      state.batches = state.batches.filter((b) => b.quantity > 0);
      state.reservations = state.reservations.filter((r) => r.id !== id);
      return receipt;
    },
    release: (id: string) => {
      state.reservations = state.reservations.filter((r) => r.id !== id);
    },
    sell(id: string, n: number) {
      const b = state.batches.find((b) => b.id === id);
      if (!b || available(b, state.reservations) < n) return null;
      b.quantity -= n;
      if (!b.quantity) state.batches = state.batches.filter((b) => b.id !== id);
      return b.item;
    },
    tick(hour: number) {
      const expired = state.batches.filter((b) => b.expires <= hour);
      state.wasted += expired.reduce((n, b) => n + b.quantity, 0);
      state.batches = state.batches.filter((b) => b.expires > hour);
      state.reservations = state.reservations.filter(
        (r) =>
          !r.allocations.some((a) => expired.some((b) => b.id === a.batch)),
      );
      if (expired.length) notice(`${expired.length} 批库存已到保质期`);
    },
    snapshot: () => JSON.parse(JSON.stringify(state)) as typeof state,
    restore: (data: typeof state) => {
      Object.assign(state, data);
    },
  };
}
