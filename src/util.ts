export function formatSeconds(seconds: number) {
  const flooredSeconds = Math.floor(seconds);
  const minutes = Math.floor(flooredSeconds / 60);
  const remainingSeconds = flooredSeconds - minutes * 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
