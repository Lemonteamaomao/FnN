// Lighting and moisture stay in the can's own SVG coordinates, so every detail
// follows the existing scroll transform without moving the pouring anchor.
export function enhanceCan(svg) {
  const ns = 'http://www.w3.org/2000/svg';
  const add = (name, attributes, parent) => {
    const el = document.createElementNS(ns, name);
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
    parent.append(el);
    return el;
  };
  const defs = svg.querySelector('defs');
  const gradient = (id, stops, attrs = {}) => {
    const el = add('linearGradient', { id, x1: '0', x2: '1', y1: '0', y2: '0', ...attrs }, defs);
    stops.forEach(([offset, color, opacity = 1]) => add('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, el));
  };
  gradient('cylinder-light', [[0, '#11051f', .78], [.09, '#19072e', .32], [.22, '#ffffff', .08], [.34, '#ffffff', .3], [.47, '#ffffff', .03], [.68, '#170627', .12], [.86, '#160526', .52], [.96, '#e7c8ff', .36], [1, '#170629', .65]]);
  gradient('metal-polish', [[0, '#555064'], [.06, '#f5f4fa'], [.17, '#aba9bb'], [.29, '#fff'], [.45, '#bcb8cd'], [.64, '#f1eff9'], [.85, '#888395'], [.94, '#fff'], [1, '#5a5468']]);
  gradient('lid-depth', [[0, '#dbd9e5'], [.38, '#8f899f'], [.57, '#ccc8d6'], [1, '#eeedf5']], { x1: '0', x2: '.3', y1: '0', y2: '1' });
  gradient('wet-reflection', [[0, '#fff', 0], [.4, '#fff', .08], [.5, '#fff', .66], [.6, '#fff', .08], [1, '#fff', 0]]);
  const water = add('radialGradient', { id: 'water-bead', cx: '.32', cy: '.23', r: '.8' }, defs);
  [[0, '#fff', .85], [.18, '#eee5ff', .32], [.56, '#9372b0', .02], [.85, '#17052a', .35], [1, '#ead9ff', .6]].forEach(([offset, color, opacity]) => add('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, water));

  const surface = add('g', { 'clip-path': 'url(#can-shape)', 'aria-hidden': 'true', class: 'can-surface' }, svg);
  add('rect', { x: 74, y: 91, width: 192, height: 445, fill: 'url(#cylinder-light)' }, surface);
  add('path', { d: 'M103 104Q96 290 109 512', fill: 'none', stroke: '#eacbff', 'stroke-width': 2, 'stroke-opacity': .35 }, surface);
  add('path', { d: 'M246 106Q254 300 242 513', fill: 'none', stroke: '#e5c2ff', 'stroke-width': 1.2, 'stroke-opacity': .6 }, surface);
  add('path', { d: 'M126 100Q111 275 127 522L145 522Q131 280 146 100Z', fill: 'url(#wet-reflection)', opacity: .38, class: 'can-reflection' }, surface);

  const condensation = add('g', { class: 'condensation' }, surface);
  for (let i = 0; i < 100; i++) {
    const x = 86 + ((i * 73.19) % 165);
    const y = 109 + ((i * 47.73) % 406);
    const r = i % 11 === 0 ? 3.5 : .6 + ((i * .71) % 1.7);
    const ry = r * (i % 7 === 0 ? 1.65 : 1.15);
    add('ellipse', { cx: x + .45, cy: y + .8, rx: r, ry, fill: '#160527', opacity: .22 }, condensation);
    add('ellipse', { cx: x, cy: y, rx: r, ry, fill: 'url(#water-bead)', stroke: '#eedfff', 'stroke-opacity': .25, 'stroke-width': .35 }, condensation);
    if (r > 1.5) add('ellipse', { cx: x - r * .3, cy: y - ry * .35, rx: r * .26, ry: ry * .15, fill: '#fff', opacity: .85 }, condensation);
  }

  const lid = add('g', { class: 'can-lid', 'aria-hidden': 'true' }, svg);
  add('path', { d: 'M71 77Q72 59 91 57H249Q269 59 269 77L266 91Q170 111 74 91Z', fill: 'url(#metal-polish)', stroke: '#d1c9df', 'stroke-width': 1 }, lid);
  add('ellipse', { cx: 170, cy: 75, rx: 96, ry: 19, fill: 'url(#metal-polish)', stroke: '#fff', 'stroke-opacity': .8, 'stroke-width': 1.5 }, lid);
  add('ellipse', { cx: 170, cy: 75, rx: 87, ry: 15, fill: 'url(#lid-depth)', stroke: '#666073', 'stroke-width': 1.4 }, lid);
  add('ellipse', { cx: 170, cy: 74, rx: 81, ry: 11, fill: 'none', stroke: '#edeaf5', 'stroke-width': 1, 'stroke-opacity': .7 }, lid);
  add('ellipse', { cx: 226, cy: 76, rx: 20, ry: 8, fill: '#15101f', stroke: '#f9f7ff', 'stroke-width': 2 }, lid);
  add('path', { d: 'M209 77Q225 67 242 76', fill: 'none', stroke: '#645c71', 'stroke-width': 2 }, lid);
  add('path', { d: 'M154 68Q158 61 169 61L192 63Q202 66 199 73L190 80L160 77Z', fill: 'url(#metal-polish)', stroke: '#6a6277', 'stroke-width': 1 }, lid);
  add('ellipse', { cx: 176, cy: 68, rx: 11, ry: 3.2, fill: '#686174', stroke: '#f9f6ff', 'stroke-width': 1 }, lid);
  add('ellipse', { cx: 167, cy: 76, rx: 3.2, ry: 1.7, fill: '#eae5f2', stroke: '#888091', 'stroke-width': .6 }, lid);
  add('path', { d: 'M80 86Q169 109 261 85', fill: 'none', stroke: '#fff', 'stroke-width': 1.5, 'stroke-opacity': .9 }, lid);
  add('path', { d: 'M99 533Q170 551 241 533L234 553Q169 570 106 553Z', fill: 'url(#metal-polish)', stroke: '#d5cfdf', 'stroke-width': 1 }, svg);
  add('path', { d: 'M107 550Q170 566 234 549', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-opacity': .8 }, svg);
}
