export type Item = "carrot" | "corn" | "berry" | "jam" | "flour";
export type Weather = "sun" | "rain" | "wind";
export interface Traits {
  drought: number;
  speed: number;
}
export interface Crop {
  item: Item;
  planted: number;
  growth: number;
  water: number;
  stress: number;
  harvests: number;
  variety?: string;
  traits?: Traits;
  pollenBy?: string | null;
  pollenUsed?: boolean;
}
export interface Plot {
  id: number;
  crop: Crop | null;
}
export type SeedChoice =
  | { kind: "wild"; item: Item }
  | { kind: "seed"; stock: string };
export interface Variety {
  id: string;
  name: string;
  item: Item;
  parents: readonly [string, string];
  lineage: readonly [string, string];
  drought: number;
  speed: number;
  created: number;
}
export interface SeedStock {
  id: string;
  variety: string;
  item: Item;
  quantity: number;
  parents: readonly [string, string];
  drought: number;
  speed: number;
  created: number;
}
export interface CrossRef {
  plot: number;
  signature: string;
  identity: string;
  label: string;
}
export interface Cross {
  id: string;
  a: CrossRef;
  b: CrossRef;
  item: Item;
  drought: number;
  speed: number;
  finish: number;
  status: "growing" | "done";
}
export interface BreedingOrder {
  id: string;
  item: Item;
  minDrought: number;
  minSpeed: number;
  quantity: number;
  reward: number;
  deadline: number;
  status: "open" | "done" | "expired";
}
export interface Receipt {
  quality: number;
  sources: readonly string[];
  quantity: number;
  variety?: string | null;
}
export interface Batch {
  id: string;
  item: Item;
  quantity: number;
  quality: number;
  source: string;
  expires: number;
  variety?: string;
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
  variety?: string;
}
export interface Tick {
  from: number;
  to: number;
  weather: Weather;
}
export type Notice = (message: string) => void;
