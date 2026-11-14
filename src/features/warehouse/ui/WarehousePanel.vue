<script setup lang="ts">
import type { Batch } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
defineProps<{
  batches: readonly Readonly<Batch>[];
  hour: number;
  free: (id: string) => number;
  wasted: number;
}>();
defineEmits<{ sell: [id: string] }>();
</script>
<template>
  <section class="panel warehouse-panel">
    <div class="panel-heading">
      <h2>谷仓库存</h2>
      <span>{{ batches.length }} 批 · 损耗 {{ wasted }}</span>
    </div>
    <div class="inventory-list">
      <div v-for="batch in batches" :key="batch.id" class="inventory-row">
        <b class="item-icon">{{ items[batch.item].icon }}</b>
        <div>
          <strong
            >{{ items[batch.item].name }}
            <em>{{ "★".repeat(batch.quality) }}</em></strong
          ><small
            >{{ batch.id }} · {{ batch.source }} · {{ batch.expires - hour }}h
            后到期</small
          >
        </div>
        <div class="quantity">
          <strong>×{{ batch.quantity }}</strong
          ><small>可用 {{ free(batch.id) }}</small>
        </div>
        <button :disabled="!free(batch.id)" @click="$emit('sell', batch.id)">
          卖 1
        </button>
      </div>
      <p v-if="!batches.length" class="empty">谷仓空了，去田里收获吧。</p>
    </div>
    <p class="hint">按先到期批次配货 · 已占用货物不可出售</p>
  </section>
</template>
