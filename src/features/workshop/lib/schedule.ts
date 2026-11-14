import type { Job } from "../../../shared/contracts";
export const queueFinish = (
  jobs: readonly Job[],
  hour: number,
  duration: number,
) =>
  Math.max(
    hour,
    ...jobs.filter((j) => j.status === "queued").map((j) => j.finish),
  ) + duration;
export const queueProgress = (finish: number, hour: number, duration: number) =>
  Math.max(0, Math.min(100, (1 - (finish - hour) / duration) * 100));
