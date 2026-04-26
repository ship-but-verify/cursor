/** Format seconds since run start as HH:MM:SS.mmm */
export function formatRunTime(sec: number): string {
  const ms = Math.floor((sec % 1) * 1000);
  const t = Math.floor(sec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${ms.toString().padStart(3, "0")}`;
}
