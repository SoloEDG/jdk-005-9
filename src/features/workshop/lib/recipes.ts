import type { Item } from "../../../shared/contracts";
export interface Recipe {
  id: string;
  name: string;
  input: Item;
  amount: number;
  output: Item;
  quantity: number;
  duration: number;
  cost: number;
}
export const recipes: Recipe[] = [
  {
    id: "jam",
    name: "莓果酱",
    input: "berry",
    amount: 3,
    output: "jam",
    quantity: 2,
    duration: 8,
    cost: 4,
  },
  {
    id: "flour",
    name: "玉米粉",
    input: "corn",
    amount: 4,
    output: "flour",
    quantity: 3,
    duration: 6,
    cost: 3,
  },
];
export const recipeById = (id: string) => recipes.find((r) => r.id === id);
