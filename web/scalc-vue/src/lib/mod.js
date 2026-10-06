/** Maximum operating depth in metres for O2 percent and ppO2 (bar/ATA). */
export function calculateMod(o2Pct, ppo2) {
  return 10 * (ppo2 / (o2Pct / 100) - 1)
}
