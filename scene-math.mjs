export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const range = (value, start, end) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
export const envelope = (p, enter, full, exit, gone) => range(p, enter, full) * (1 - range(p, exit, gone));
export function sceneState(p) {
  p = clamp(p);
  return {
    progress: p,
    tilt: -12 + 94 * range(p, .035, .24) * (1 - range(p, .59, .78)),
    pour: range(p, .12, .25) * (1 - range(p, .59, .71)),
    flood: range(p, .26, .49),
    finale: range(p, .78, .92),
    hero: 1 - range(p, .025, .13),
    wave: envelope(p, .27, .34, .43, .49),
    bold: envelope(p, .47, .51, .57, .61),
    fizzy: envelope(p, .59, .63, .69, .73),
    fun: envelope(p, .71, .75, .81, .85),
    chapter: p < .14 ? 0 : p < .3 ? 1 : p < .49 ? 2 : p < .84 ? 3 : 4
  };
}
