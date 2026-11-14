<script setup lang="ts">
import type {
  Item,
  Plot,
  SeedChoice,
  SeedStock,
  Variety,
} from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { crops, ready, flowering } from "../lib/crops";
import { traitLabel } from "../../breeding/lib/genetics";
const props = defineProps<{
  plots: readonly Readonly<Plot>[];
  selected: SeedChoice;
  active: number;
  stocks: readonly SeedStock[];
  varieties: readonly Variety[];
}>();
defineEmits<{
  select: [choice: SeedChoice];
  plant: [id: number];
  water: [id: number];
  harvest: [id: number, mode: "produce" | "seed"];
  remove: [id: number];
}>();
const seeds: Item[] = ["carrot", "corn", "berry"];
const varietyName = (id?: string) =>
  props.varieties.find((v) => v.id === id)?.name ?? "未知品种";
const plantLabel = (choice: SeedChoice) => {
  if (choice.kind === "wild")
    return `播种 ${items[choice.item].name} · ¥${crops[choice.item]?.cost}`;
  const stock = props.stocks.find((s) => s.id === choice.stock);
  return stock ? `播种「${varietyName(stock.variety)}」种子` : "播种";
};
</script>
<template>
  <section class="panel seed-panel">
    <div class="panel-heading">
      <h2>土地与种植</h2>
      <span>12 块沃土</span>
    </div>
    <div class="seed-list">
      <button
        v-for="item in seeds"
        :key="item"
        :class="{
          selected: selected.kind === 'wild' && selected.item === item,
        }"
        @click="$emit('select', { kind: 'wild', item })"
      >
        <b>{{ items[item].icon }}</b><strong>{{ items[item].name }}</strong
        ><small>{{ crops[item]?.duration }}h · ¥{{ crops[item]?.cost }}</small>
      </button>
    </div>
    <div v-if="stocks.length" class="seed-list variety-seeds">
      <button
        v-for="s in stocks"
        :key="s.id"
        :class="{ selected: selected.kind === 'seed' && selected.stock === s.id }"
        @click="$emit('select', { kind: 'seed', stock: s.id })"
      >
        <b>{{ items[s.item].icon }}</b><strong>「{{ varietyName(s.variety) }}」</strong
        ><small>{{ traitLabel(s) }} · ×{{ s.quantity }}</small>
      </button>
    </div>
    <div class="plot-details">
      <strong>土地 {{ active + 1 }}</strong
      ><template v-if="plots[active]?.crop"
        ><span
          ><template v-if="plots[active]!.crop!.variety"
            >「{{ varietyName(plots[active]!.crop!.variety) }}」</template
          >{{ items[plots[active]!.crop!.item].name }} · 生长
          {{ plots[active]!.crop!.growth.toFixed(1) }} /
          {{ crops[plots[active]!.crop!.item]?.duration }}h · 水分
          {{ plots[active]!.crop!.water }}%
          <em v-if="ready(plots[active]!.crop!)" class="tag">可收获</em>
          <em v-else-if="flowering(plots[active]!.crop!)" class="tag bloom"
            >开花期</em
          >
          <em v-if="plots[active]!.crop!.traits" class="tag trait">{{
            traitLabel(plots[active]!.crop!.traits!)
          }}</em>
          <em v-if="plots[active]!.crop!.pollenBy" class="tag bloom">授粉中</em
          ><em v-else-if="plots[active]!.crop!.pollenUsed" class="tag"
            >本轮已取粉</em
          ></span
        ><button @click="$emit('water', active)">浇水 +</button
        ><button
          :disabled="!ready(plots[active]!.crop!)"
          @click="$emit('harvest', active, 'produce')"
        >
          收获作物</button
        ><button
          v-if="plots[active]!.crop!.variety"
          :disabled="!ready(plots[active]!.crop!)"
          @click="$emit('harvest', active, 'seed')"
        >
          留种</button
        ><button @click="$emit('remove', active)">摘除</button></template
      ><template v-else
        ><span>翻好的土地，等待新种子</span
        ><button class="primary" @click="$emit('plant', active)">
          {{ plantLabel(selected) }}
        </button></template
      >
    </div>
  </section>
</template>
