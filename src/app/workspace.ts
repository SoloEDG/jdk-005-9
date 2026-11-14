import { ref } from "vue";
import { createClock, createEngine } from "../features/clock";
import { createFields } from "../features/fields";
import { createWarehouse } from "../features/warehouse";
import { createWorkshop } from "../features/workshop";
import { createOrders, salePrice } from "../features/orders";
import { createBreeding } from "../features/breeding";
import { items } from "../shared/catalog";
import { saveFarm, loadFarm } from "./persistence";
export function createWorkspace() {
  const notices = ref<string[]>(["欢迎回到青禾农场。先备一份胡萝卜订单吧。"]);
  const notice = (message: string) => {
    notices.value = [message, ...notices.value].slice(0, 12);
  };
  const clock = createClock();
  const warehouse = createWarehouse(() => clock.state.hour, notice);
  let breeding: ReturnType<typeof createBreeding>;
  const orders = createOrders(
    warehouse,
    notice,
    clock.state.hour,
    () => breeding?.pickVariety() ?? null,
  );
  const fields = createFields(
    {
      spend: orders.spend,
      takeSeed: (stock) => breeding.takeSeed(stock),
      keepSeeds: (variety, n, hour) => breeding.keepSeeds(variety, n, hour),
    },
    (item, n, q, variety) =>
      warehouse.add(
        item,
        n,
        q,
        undefined,
        variety ? `田间收获 · ${breeding.varietyName(variety)}` : "田间收获",
        variety,
      ),
    notice,
  );
  breeding = createBreeding(fields, orders.earn, notice, clock.state.hour);
  const workshop = createWorkshop(
    { ...warehouse, spend: orders.spend },
    notice,
  );
  const engine = createEngine(
    () => clock.state.hour,
    clock.setHour,
    (t) => {
      warehouse.tick(t.to);
      fields.tick(t);
      breeding.tick(t.to);
      workshop.tick(t.to);
      orders.tick(t.to);
    },
  );
  const snapshot = () => ({
    clock: clock.snapshot(),
    warehouse: warehouse.snapshot(),
    fields: fields.snapshot(),
    breeding: breeding.snapshot(),
    workshop: workshop.snapshot(),
    orders: orders.snapshot(),
  });
  return {
    clock,
    warehouse,
    fields,
    breeding,
    workshop,
    orders,
    engine,
    notices,
    harvestPlot(id: number, mode: "produce" | "seed") {
      fields.harvest(id, mode, clock.state.hour);
      breeding.cancelForPlot(id);
    },
    removePlot(id: number) {
      fields.remove(id);
      breeding.cancelForPlot(id);
    },
    sell(id: string) {
      const item = warehouse.sell(id, 1);
      if (item) {
        orders.earn(salePrice(items[item].value));
        notice(`出售${items[item].name} 1 份`);
      }
    },
    save() {
      try {
        saveFarm(snapshot());
        notice("已保存到本机");
      } catch {
        notice("保存失败，本机空间不足");
      }
    },
    load() {
      try {
        const data = loadFarm<ReturnType<typeof snapshot>>();
        if (!data) {
          notice("还没有本机存档");
          return;
        }
        clock.restore(data.clock);
        warehouse.restore(data.warehouse);
        fields.restore(data.fields);
        if (data.breeding) breeding.restore(data.breeding);
        workshop.restore(data.workshop);
        orders.restore(data.orders);
        notice("已恢复保存时刻");
      } catch {
        notice("存档损坏，无法恢复");
      }
    },
  };
}
