const ms = Date.now() + (5 * 60 + 30) * 60 * 1000;
const d = new Date(ms);
console.log("ist now:", d.toISOString());
console.log("today:", d.toISOString().slice(0, 10));
console.log("tomorrow:", new Date(ms + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
// print a few valid slot candidates
const candidates = ["07:00", "08:00", "09:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
for (const s of candidates) {
  const [hh, mm] = s.split(":").map(Number);
  const at = new Date(ms);
  at.setUTCHours(hh, mm, 0, 0);
  const diff = at.getTime() - ms;
  console.log(s, "diff(min):", Math.round(diff / 60000), diff > 30 * 60000 && diff <= 24 * 3600000 ? "OK" : "skip");
}