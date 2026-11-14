<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { ClockPanel, weatherAt } from "../features/clock";
import { FarmScene, FieldsPanel } from "../features/fields";
import { WarehousePanel } from "../features/warehouse";
import { WorkshopPanel } from "../features/workshop";
import { OrdersPanel, EconomyPanel } from "../features/orders";
import { createWorkspace } from "./workspace";
const farm = createWorkspace(),
  active = ref(0),
  tab = ref("warehouse");
const { clock, warehouse, fields, workshop, orders, engine, notices } = farm;
const timer = setInterval(() => {
  if (!clock.state.paused) engine.advance(1);
}, 1500);
onUnmounted(() => clearInterval(timer));
function reset() {
  if (confirm("开始一座新农场？已保存的存档仍然保留。")) location.reload();
}
</script>
<template>
  <div class="workspace">
    <header class="topbar">
      <a class="brand" href="#"
        ><span class="brand-icon">✿</span>
        <div><strong>青禾农场</strong><small>MEADOW POST</small></div></a
      >
      <nav>
        <span class="active">农场日常</span><span>慢慢生长，好好生活。</span>
      </nav>
      <div class="farmer">
        <span>👒</span>
        <div>农场主<small>初夏 · 第一年</small></div>
      </div>
    </header>
    <main>
      <div class="title-row">
        <div>
          <span class="eyebrow">A LITTLE PLACE TO GROW</span>
          <h1>把日子，种进田里。</h1>
          <p>照料作物、手作好物，让每一次收获都有回响。</p>
        </div>
        <EconomyPanel
          :coins="orders.state.coins"
          :xp="orders.state.xp"
          :delivered="orders.state.delivered"
        />
      </div>
      <ClockPanel
        :hour="clock.state.hour"
        :paused="clock.state.paused"
        @advance="engine.advance"
        @toggle="clock.toggle"
        @save="farm.save"
        @load="farm.load"
        @reset="reset"
      />
      <div class="main-grid">
        <div class="farm-column">
          <div class="scene-heading">
            <h2>我的小小农场</h2>
            <span><i></i> 点击土地照料作物</span>
          </div>
          <FarmScene
            :plots="fields.state.plots"
            :weather="weatherAt(clock.state.hour)"
            @plot="(id) => (active = id)"
          /><FieldsPanel
            :plots="fields.state.plots"
            :selected="fields.state.selected"
            :active="active"
            @select="fields.select"
            @plant="(id) => fields.plant(id, clock.state.hour)"
            @water="fields.water"
            @harvest="fields.harvest"
          />
          <section class="activity">
            <span>农场手记</span>
            <p v-for="(message, i) in notices.slice(0, 3)" :key="i">
              {{ message }}
            </p>
          </section>
        </div>
        <aside>
          <div class="tabs">
            <button
              :class="{ active: tab === 'warehouse' }"
              @click="tab = 'warehouse'"
            >
              谷仓</button
            ><button
              :class="{ active: tab === 'workshop' }"
              @click="tab = 'workshop'"
            >
              工坊</button
            ><button
              :class="{ active: tab === 'orders' }"
              @click="tab = 'orders'"
            >
              订单
            </button>
          </div>
          <WarehousePanel
            v-if="tab === 'warehouse'"
            :batches="warehouse.state.batches"
            :hour="clock.state.hour"
            :free="warehouse.free"
            :wasted="warehouse.state.wasted"
            @sell="farm.sell"
          /><WorkshopPanel
            v-if="tab === 'workshop'"
            :jobs="workshop.state.jobs"
            :hour="clock.state.hour"
            @enqueue="(id) => workshop.enqueue(id, clock.state.hour)"
            @claim="(id) => workshop.claim(id, clock.state.hour)"
          /><OrdersPanel
            v-if="tab === 'orders'"
            :orders="orders.state.orders"
            :hour="clock.state.hour"
            @reserve="orders.reserve"
            @deliver="(id) => orders.deliver(id, clock.state.hour)"
            @cancel="orders.cancel"
          />
          <div class="tip-card">
            <span>✦ 今日小贴士</span>
            <p>
              雨天不用浇水，可以留些时间给工坊。<br />蓝莓能连续收获三次，记得照顾它。
            </p>
            <small>跟着季节的节奏，慢慢来就好。</small>
          </div>
        </aside>
      </div>
      <footer>
        MEADOW POST <span>一份耕耘，一份欢喜。</span
        ><span>本地保存 · 无需联网</span>
      </footer>
    </main>
  </div>
</template>
