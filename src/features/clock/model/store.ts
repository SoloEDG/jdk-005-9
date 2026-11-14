import { reactive, readonly } from "vue";
export function createClock() {
  const state = reactive({ hour: 6, paused: true, speed: 1 });
  return {
    state: readonly(state),
    setHour: (hour: number) => {
      state.hour = hour;
    },
    toggle: () => {
      state.paused = !state.paused;
    },
    snapshot: () => ({ ...state }),
    restore: (data: typeof state) => {
      Object.assign(state, data, { paused: true });
    },
  };
}
