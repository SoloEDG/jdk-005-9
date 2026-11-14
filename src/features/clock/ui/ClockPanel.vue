<script setup lang="ts">
import { computed } from "vue";
import { weatherAt, weatherInfo } from "../lib/weather";
import { hourLabel } from "../../../shared/catalog";
const props = defineProps<{ hour: number; paused: boolean }>();
defineEmits<{
  advance: [hours: number];
  toggle: [];
  save: [];
  load: [];
  reset: [];
}>();
const weather = computed(() => weatherInfo[weatherAt(props.hour)]);
</script>
<template>
  <section class="clock-bar">
    <div class="date-block">
      <span class="eyebrow">FARM ALMANAC / 01</span
      ><strong>{{ hourLabel(hour) }}</strong>
    </div>
    <div class="weather">
      <b>{{ weather.icon }}</b>
      <div>
        {{ weather.name }}<small>{{ weather.description }}</small>
      </div>
    </div>
    <div class="clock-actions">
      <button @click="$emit('toggle')">
        {{ paused ? "▶ 运行" : "Ⅱ 暂停" }}</button><button
        @click="$emit('advance', 1)"
      >
        +1 小时</button
      ><button @click="$emit('advance', 6)">+6 小时</button
      ><button @click="$emit('advance', 24)">下一天</button>
    </div>
    <div class="save-actions">
      <button @click="$emit('save')">保存</button
      ><button @click="$emit('load')">恢复</button
      ><button @click="$emit('reset')">新农场</button>
    </div>
  </section>
</template>
