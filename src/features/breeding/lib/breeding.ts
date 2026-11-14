import type {
  BreedingOrder,
  Item,
  SeedStock,
} from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
const species: Item[] = ["carrot", "corn", "berry"];
export function breedingOrder(serial: number, hour: number): BreedingOrder {
  const item = species[serial % species.length]!;
  const minDrought = 1 + (serial % 3);
  const minSpeed = 1 + ((serial + 1) % 3);
  const quantity = 2 + (serial % 3);
  return {
    id: `g${serial}`,
    item,
    minDrought,
    minSpeed,
    quantity,
    reward: 25 + 18 * (minDrought + minSpeed) + 6 * quantity,
    deadline: hour + 96,
    status: "open",
  };
}
export const initialBreedingOrders = (hour: number) => [
  breedingOrder(1, hour),
  breedingOrder(2, hour),
];
export function matchingStocks(
  stocks: readonly SeedStock[],
  order: BreedingOrder,
) {
  return stocks
    .filter(
      (s) =>
        s.item === order.item &&
        s.drought >= order.minDrought &&
        s.speed >= order.minSpeed,
    )
    .sort((a, b) => a.created - b.created);
}
export function seedableQuantity(
  stocks: readonly SeedStock[],
  order: BreedingOrder,
) {
  return matchingStocks(stocks, order).reduce((n, s) => n + s.quantity, 0);
}
export const suggestName = (item: Item, count: number) =>
  `青禾${items[item].name}${count + 1}号`;
