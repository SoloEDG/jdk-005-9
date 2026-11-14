import { reactive, readonly } from "vue";
import type { Job, Item, Notice, Receipt } from "../../../shared/contracts";
import { recipeById } from "../lib/recipes";
import { items } from "../../../shared/catalog";
import { queueFinish } from "../lib/schedule";
interface Ports {
  reserve: (owner: string, item: Item, n: number) => string | null;
  consume: (id: string) => Receipt | null;
  release: (id: string) => void;
  add: (
    item: Item,
    n: number,
    q?: number,
    hour?: number,
    source?: string,
  ) => void;
  spend: (n: number) => boolean;
}
export function createWorkshop(ports: Ports, notice: Notice) {
  const state = reactive({ jobs: [] as Job[], serial: 0 });
  return {
    state: readonly(state),
    enqueue(recipe: string, hour: number) {
      const r = recipeById(recipe);
      if (!r || state.jobs.filter((j) => j.status === "queued").length >= 4) {
        notice("加工队列已满");
        return;
      }
      const reservation = ports.reserve("workshop", r.input, r.amount);
      if (!reservation) {
        notice("加工原料不足");
        return;
      }
      if (!ports.spend(r.cost)) {
        ports.release(reservation);
        notice("加工费不足");
        return;
      }
      state.jobs.push({
        id: `j${++state.serial}`,
        recipe,
        reservation,
        finish: queueFinish(state.jobs, hour, r.duration),
        status: "queued",
      });
      notice("原料已锁定，加入加工队列");
    },
    tick(hour: number) {
      for (const job of state.jobs)
        if (job.status === "queued" && job.finish <= hour) {
          const receipt = ports.consume(job.reservation);
          if (!receipt) {
            job.status = "failed";
            notice("原料已过期，本批加工终止");
            continue;
          }
          job.receipt = receipt;
          job.status = "ready";
        }
    },
    claim(id: string, hour: number) {
      const job = state.jobs.find((j) => j.id === id),
        r = job && recipeById(job.recipe);
      if (!job || job.status !== "ready" || !r) return;
      if (!job.receipt) return;
      if (job.finish + items[r.output].life <= hour) {
        job.status = "failed";
        notice("成品存放过久，已变质");
        return;
      }
      ports.add(
        r.output,
        r.quantity,
        job.receipt.quality,
        job.finish,
        `工坊${job.id} · ${job.receipt.sources.join(" / ")}`,
      );
      job.status = "claimed";
      notice("成品已入仓");
    },
    snapshot: () => JSON.parse(JSON.stringify(state)) as typeof state,
    restore: (data: typeof state) => {
      Object.assign(state, data);
    },
  };
}
