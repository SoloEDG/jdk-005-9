<script setup lang="ts">
import { computed, ref } from "vue";
import type {
  BreedingOrder,
  Cross,
  Plot,
  SeedStock,
  Variety,
} from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { flowering } from "../../fields/lib/crops";
import {
  CROSS_HOURS,
  WILD_TRAITS,
  offspring,
  traitLabel,
  wildIdentity,
} from "../lib/genetics";
import { seedableQuantity, suggestName } from "../lib/breeding";
const props = defineProps<{
  plots: readonly Readonly<Plot>[];
  varieties: readonly Variety[];
  stocks: readonly SeedStock[];
  crosses: readonly Cross[];
  orders: readonly BreedingOrder[];
  draft: { a: number | null; b: number | null };
  hour: number;
}>();
const emit = defineEmits<{
  choose: [slot: "a" | "b", plot: number];
  drop: [slot: "a" | "b"];
  start: [];
  cancel: [id: string];
  register: [id: string, name: string];
  fulfill: [id: string];
}>();
const names = ref<Record<string, string>>({});
const cropAt = (plot: number) => props.plots[plot]?.crop ?? null;
const varietyName = (id?: string | null) =>
  props.varieties.find((v) => v.id === id)?.name ?? "未知品种";
const label = (plot: number) => {
  const c = cropAt(plot);
  if (!c) return "空地";
  return c.variety
    ? `「${varietyName(c.variety)}」`
    : `野生${items[c.item].name}`;
};
const traitsOf = (plot: number) => cropAt(plot)?.traits ?? WILD_TRAITS;
const identityOf = (plot: number) =>
  cropAt(plot)?.variety ?? wildIdentity(cropAt(plot)?.item ?? "");
const floweringPlots = computed(() =>
  props.plots.filter((p) => p.crop && flowering(p.crop)),
);
const preview = computed(() => {
  const { a, b } = props.draft;
  if (a === null || b === null || !cropAt(a) || !cropAt(b)) return null;
  return offspring(identityOf(a), traitsOf(a), identityOf(b), traitsOf(b));
});
const growing = computed(() =>
  props.crosses.filter((x) => x.status === "growing"),
);
const done = computed(() => props.crosses.filter((x) => x.status === "done"));
const progress = (cross: Cross) =>
  Math.max(
    0,
    Math.min(100, (1 - (cross.finish - props.hour) / CROSS_HOURS) * 100),
  );
const openOrders = computed(() =>
  props.orders.filter((o) => o.status === "open"),
);
const register = (id: string) => {
  emit("register", id, names.value[id] ?? "");
  names.value[id] = "";
};
</script>
<template>
  <section class="panel breeding-panel">
    <div class="panel-heading">
      <h2>育种圃</h2>
      <span>培育并命名自己的品种</span>
    </div>
    <div class="cross-box">
      <div class="parent-slots">
        <div class="parent-slot" :class="{ filled: draft.a !== null }">
          <small>母本</small>
          <strong>{{
            draft.a !== null ? `地块${draft.a + 1} · ${label(draft.a)}` : "待选择"
          }}</strong>
          <button v-if="draft.a !== null" @click="emit('drop', 'a')">×</button>
        </div>
        <b>✿</b>
        <div class="parent-slot" :class="{ filled: draft.b !== null }">
          <small>父本</small>
          <strong>{{
            draft.b !== null ? `地块${draft.b + 1} · ${label(draft.b)}` : "待选择"
          }}</strong>
          <button v-if="draft.b !== null" @click="emit('drop', 'b')">×</button>
        </div>
      </div>
      <p v-if="preview" class="preview">
        预计性状：{{ traitLabel(preview) }}
        <small>亲本固定，结果不会重抽</small>
      </p>
      <button
        class="primary"
        :disabled="!preview"
        @click="emit('start')"
      >
        开始杂交 · {{ CROSS_HOURS }}h
      </button>
    </div>
    <div class="breeding-block">
      <span class="block-title">开花中的作物</span>
      <div v-for="p in floweringPlots" :key="p.id" class="flower-row">
        <b>{{ items[p.crop!.item].icon }}</b>
        <div>
          <strong>地块{{ p.id + 1 }} · {{ label(p.id) }}</strong>
          <small
            >{{ traitLabel(traitsOf(p.id))
            }}{{
              p.crop!.pollenBy
                ? " · 授粉中"
                : p.crop!.pollenUsed
                  ? " · 本轮已取粉"
                  : ""
            }}</small
          >
        </div>
        <button
          :disabled="!!p.crop!.pollenBy || !!p.crop!.pollenUsed"
          @click="emit('choose', 'a', p.id)"
        >
          作母本</button
        ><button
          :disabled="!!p.crop!.pollenBy || !!p.crop!.pollenUsed"
          @click="emit('choose', 'b', p.id)"
        >
          作父本
        </button>
      </div>
      <p v-if="!floweringPlots.length" class="hint">
        暂无开花中的作物，作物长到六成便会开花。
      </p>
    </div>
    <div v-if="growing.length" class="breeding-block">
      <span class="block-title">进行中的杂交</span>
      <div v-for="cross in growing" :key="cross.id" class="cross-row">
        <div>
          <strong>{{ cross.a.label }} × {{ cross.b.label }}</strong>
          <small
            >{{ items[cross.item].name }} ·
            {{ traitLabel({ drought: cross.drought, speed: cross.speed }) }} ·
            还需 {{ Math.max(0, cross.finish - hour) }}h</small
          >
        </div>
        <progress :value="progress(cross)" max="100"></progress>
        <button @click="emit('cancel', cross.id)">取消</button>
      </div>
    </div>
    <div v-if="done.length" class="breeding-block">
      <span class="block-title">待登记的品种</span>
      <div v-for="cross in done" :key="cross.id" class="cross-row">
        <div>
          <strong>{{ cross.a.label }} × {{ cross.b.label }}</strong>
          <small
            >{{ items[cross.item].name }} ·
            {{ traitLabel({ drought: cross.drought, speed: cross.speed }) }}</small
          >
        </div>
        <input
          v-model="names[cross.id]"
          :placeholder="suggestName(cross.item, varieties.length)"
          maxlength="12"
        />
        <button class="primary" @click="register(cross.id)">
          登记品种收种
        </button>
      </div>
    </div>
    <div class="breeding-block">
      <span class="block-title">品种图鉴 · {{ varieties.length }}</span>
      <div v-for="v in varieties" :key="v.id" class="variety-row">
        <b>{{ items[v.item].icon }}</b>
        <div>
          <strong
            >「{{ v.name }}」<em>{{ items[v.item].name }}</em></strong
          >
          <small
            >{{ traitLabel(v) }} · 亲本：{{ v.parents[0] }} ×
            {{ v.parents[1] }}</small
          >
        </div>
      </div>
      <p v-if="!varieties.length" class="hint">
        还没有自育品种，让两株开花的同种作物杂交吧。
      </p>
    </div>
    <div class="breeding-block">
      <span class="block-title">种子匣</span>
      <div v-for="s in stocks" :key="s.id" class="stock-row">
        <b>{{ items[s.item].icon }}</b>
        <div>
          <strong>「{{ varietyName(s.variety) }}」种子 ×{{ s.quantity }}</strong>
          <small
            >{{ traitLabel(s) }} · 亲本：{{ s.parents[0] }} ×
            {{ s.parents[1] }}</small
          >
        </div>
      </div>
      <p v-if="!stocks.length" class="hint">
        种子匣空了，登记品种或留种收获都能补充种子。
      </p>
    </div>
    <div class="breeding-block">
      <span class="block-title">村里育种订单</span>
      <div v-for="o in openOrders" :key="o.id" class="breed-order">
        <div>
          <strong
            >{{ items[o.item].icon }} {{ items[o.item].name }}种子 ×{{
              o.quantity
            }}</strong
          >
          <small
            >耐旱≥{{ o.minDrought }} · 速生≥{{ o.minSpeed }} · 剩余
            {{ Math.max(0, o.deadline - hour) }}h · 可交付
            {{ seedableQuantity(stocks, o) }}</small
          >
        </div>
        <b class="reward">¥{{ o.reward }}</b>
        <button
          :disabled="seedableQuantity(stocks, o) < o.quantity"
          @click="emit('fulfill', o.id)"
        >
          交付
        </button>
      </div>
      <p v-if="!openOrders.length" class="hint">暂无育种订单。</p>
    </div>
    <p class="hint">
      同一轮每株只能取一次花粉；摘除或收获亲本会取消未完成的杂交。
    </p>
  </section>
</template>
