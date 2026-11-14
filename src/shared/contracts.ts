export type Item = "carrot" | "corn" | "berry" | "jam" | "flour";
export type Weather = "sun" | "rain" | "wind";
export interface Crop {
  item: Item;
  planted: number;
  growth: number;
  water: number;
  stress: number;
  harvests: number;
}
export interface Plot {
  id: number;
  crop: Crop | null;
}
export interface Receipt {
  quality: number;
  sources: readonly string[];
  quantity: number;
}
export interface Batch {
  id: string;
  item: Item;
  quantity: number;
  quality: number;
  source: string;
  expires: number;
}
export interface Allocation {
  batch: string;
  quantity: number;
}
export interface Reservation {
  id: string;
  owner: string;
  allocations: Allocation[];
}
export interface Job {
  id: string;
  recipe: string;
  reservation: string;
  receipt?: Receipt;
  finish: number;
  status: "queued" | "ready" | "claimed" | "failed";
}
export interface Order {
  id: string;
  item: Item;
  quantity: number;
  reward: number;
  minQuality: number;
  deadline: number;
  status: "open" | "reserved" | "delivered" | "expired";
  reservation?: string;
}
export interface Tick {
  from: number;
  to: number;
  weather: Weather;
}
export type Notice = (message: string) => void;
