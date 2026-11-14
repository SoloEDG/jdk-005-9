<script setup lang="ts">
import type { Order, Variety } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
const props = defineProps<{
  orders: readonly Readonly<Order>[];
  hour: number;
  varieties: readonly Variety[];
}>();
defineEmits<{
  reserve: [id: string];
  deliver: [id: string];
  cancel: [id: string];
}>();
const statusName = {
  open: "待备货",
  reserved: "已备货",
  delivered: "已交付",
  expired: "已过期",
};
const varietyName = (id?: string) =>
  props.varieties.find((v) => v.id === id)?.name ?? "未知品种";
</script>
<template>
  <section class="panel orders-panel">
    <div class="panel-heading">
      <h2>村庄订单</h2>
      <span>按时交付，积累声望</span>
    </div>
    <article
      v-for="order in orders"
      :key="order.id"
      class="order-card"
      :class="order.status"
    >
      <div class="order-icon">{{ items[order.item].icon }}</div>
      <div class="order-info">
        <strong
          >{{ items[order.item].name }} ×{{ order.quantity }}
          <em>{{ "★".repeat(order.minQuality) }}起</em></strong
        ><small
          >{{ order.id }} · {{ statusName[order.status] }} ·
          {{ Math.max(0, order.deadline - hour) }}h</small
        >
        <small v-if="order.variety" class="variety-tag"
          >指定品种「{{ varietyName(order.variety) }}」</small
        >
      </div>
      <b class="reward">¥{{ order.reward }}</b>
      <div class="order-actions">
        <button
          v-if="order.status === 'open'"
          @click="$emit('reserve', order.id)"
        >
          备货</button
        ><template v-if="order.status === 'reserved'"
          ><button class="primary" @click="$emit('deliver', order.id)">
            交付</button
          ><button @click="$emit('cancel', order.id)">取消</button></template
        >
      </div>
    </article>
  </section>
</template>
