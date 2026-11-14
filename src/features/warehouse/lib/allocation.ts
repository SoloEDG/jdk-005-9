import type {
  Batch,
  Reservation,
  Item,
  Allocation,
} from "../../../shared/contracts";
export function available(batch: Batch, reservations: Reservation[]) {
  return (
    batch.quantity -
    reservations
      .flatMap((r) => r.allocations)
      .filter((a) => a.batch === batch.id)
      .reduce((n, a) => n + a.quantity, 0)
  );
}
export function allocate(
  batches: Batch[],
  reservations: Reservation[],
  item: Item,
  quantity: number,
  hour: number,
  minQuality = 1,
): Allocation[] | null {
  let remaining = quantity;
  const result: Allocation[] = [];
  for (const batch of batches
    .filter(
      (b) => b.item === item && b.expires > hour && b.quality >= minQuality,
    )
    .sort((a, b) => a.expires - b.expires)) {
    const n = Math.min(remaining, available(batch, reservations));
    if (n > 0) {
      result.push({ batch: batch.id, quantity: n });
      remaining -= n;
    }
    if (!remaining) return result;
  }
  return null;
}
