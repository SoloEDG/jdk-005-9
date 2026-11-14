<script setup lang="ts">
import { levelFor, progressFor } from "../lib/economy";
defineProps<{ coins: number; xp: number; delivered: number }>();
</script>
<template>
  <div class="economy">
    <div>
      <small>农场资金</small><strong>◈ {{ coins }} <em>G</em></strong>
    </div>
    <div>
      <small>经营等级</small><strong>Lv.{{ levelFor(xp) }}</strong
      ><progress :value="progressFor(xp)" max="100"></progress>
    </div>
    <div>
      <small>累计交付</small><strong>{{ delivered }} <em>单</em></strong>
    </div>
  </div>
</template>
