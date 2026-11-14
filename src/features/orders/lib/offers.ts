import type { Item, Order } from "../../../shared/contracts";
export function initialOrders(hour: number): Order[] {
  return [
    {
      id: "o1",
      item: "carrot",
      quantity: 5,
      reward: 70,
      minQuality: 1,
      deadline: hour + 36,
      status: "open",
    },
    {
      id: "o2",
      item: "jam",
      quantity: 2,
      reward: 120,
      minQuality: 2,
      deadline: hour + 48,
      status: "open",
    },
    {
      id: "o3",
      item: "flour",
      quantity: 3,
      reward: 100,
      minQuality: 1,
      deadline: hour + 60,
      status: "open",
    },
  ];
}
const processed: Partial<Record<Item, Item>> = {
  berry: "jam",
  corn: "flour",
};
export function nextOrder(
  serial: number,
  hour: number,
  variety?: { id: string; item: Item } | null,
): Order {
  if (variety && serial % 3 === 0) {
    const item = processed[variety.item] ?? variety.item;
    return {
      id: `o${serial}`,
      item,
      quantity: item === variety.item ? 4 : 2,
      reward: Math.round((90 + serial * 3) * 1.6),
      minQuality: 1,
      deadline: hour + 60,
      status: "open",
      variety: variety.id,
    };
  }
  const item = serial % 2 ? "corn" : "berry";
  return {
    id: `o${serial}`,
    item,
    quantity: 4,
    reward: 90 + serial * 3,
    minQuality: serial % 3 === 0 ? 2 : 1,
    deadline: hour + 48,
    status: "open",
  };
}
