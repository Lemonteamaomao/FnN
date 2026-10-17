import { clamp, range, envelope, sceneState } from './scene-math.mjs';
import { enhanceCan } from './can-details.mjs';

const $ = selector => document.querySelector(selector);
const track = $('.pour-track');
const scene = $('.pour-scene');
const can = $('#can-wrap');
const mouth = $('#can-mouth');
const svg = $('#liquid-svg');
const pool = $('#liquid-pool');
const poolHighlight = $('#pool-highlight');
const stream = $('#pour-stream');
const streamHighlight = $('#stream-highlight');
const splash = $('#final-splash');
const particleGroup = $('#splash-particles');
enhanceCan($('.soda-can'));
// The pool occludes the falling stream where they meet, rather than letting it
// appear to keep falling through the surface of the liquid.
svg.insertBefore(stream, pool);
svg.insertBefore(streamHighlight, pool);
svg.insertBefore(particleGroup, pool);
const media = matchMedia('(prefers-reduced-motion: reduce)');
const copies = Object.fromEntries([...document.querySelectorAll('[data-copy]')].map(el => [el.dataset.copy, el]));
const chapters = [...document.querySelectorAll('.chapter-rail button')];
let reduced = media.matches;
let requestedFrame = 0;
let width = innerWidth;
let height = innerHeight;
let trackTop = 0;
let distance = 1;
let lastProgress = -1;
let currentChapter = -1;

const bubbles = Array.from({ length: 64 }, (_, i) => {
  const el = document.createElement('i');
  const size = i % 9 === 0 ? 22 + (i % 17) : 2 + (i * 7 % 12);
  // Concentrate fizz around the product, leaving the headlines easy to read.
  const x = i % 5 === 0 ? .06 + (i * .137 % .85) : .48 + (i * .137 % .48);
  const y = .1 + (i * .193 % .8);
  el.style.setProperty('--size', `${size}px`);
  el.style.left = `${x * 100}%`;
  el.style.top = `${y * 100}%`;
  const bead = document.createElement('span');
  bead.style.setProperty('--rise', `${80 + i * 17 % 210}px`);
  bead.style.setProperty('--drift', `${Math.sin(i * 2.7) * 28}px`);
  bead.style.setProperty('--duration', `${3.5 + i * .37 % 4}s`);
  bead.style.setProperty('--delay', `${-i * .61}s`);
  el.append(bead);
  $('.bubble-field').append(el);
  return { el, i };
});
const mouthFizz = document.createElementNS('http://www.w3.org/2000/svg', 'g');
mouthFizz.id = 'mouth-fizz';
svg.append(mouthFizz);
for (let i = 0; i < 28; i++) {
  const bead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bead.setAttribute('r', .8 + i * 1.17 % 3.4);
  bead.style.setProperty('--drift', `${Math.sin(i * 2.4) * (12 + i * 2)}px`);
  bead.style.setProperty('--rise', `${24 + i * 7 % 95}px`);
  bead.style.setProperty('--duration', `${1.1 + i * .19 % 1.6}s`);
  bead.style.setProperty('--delay', `${-i * .21}s`);
  mouthFizz.append(bead);
}
const particles = Array.from({ length: 42 }, (_, i) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  el.setAttribute('fill', i % 3 ? '#b66aef' : '#e3baff');
  el.setAttribute('stroke', '#f3dcff');
  el.setAttribute('stroke-opacity', '.5');
  el.setAttribute('stroke-width', '.6');
  el.setAttribute('fill-opacity', '.7');
  particleGroup.append(el);
  return { el, angle: -Math.PI + (i / 41) * Math.PI, radius: 28 + (i * 31 % 150) };
});

function showCopy(element, opacity, p) {
  const visible = opacity > .015;
  element.style.opacity = opacity.toFixed(4);
  element.style.transform = `translateY(calc(${width <= 650 ? '0%' : '-42%'} + ${(1 - opacity) * 20}px))`;
  element.inert = !visible;
  element.setAttribute('aria-hidden', String(!visible));
}

function drawLiquid(state) {
  // Both measurements use the same viewport coordinates, then become SVG-local.
  // Measure after the can transform, keeping the stream attached in both directions.
  const bounds = scene.getBoundingClientRect();
  const opening = mouth.getBoundingClientRect();
  const x = opening.left + opening.width / 2 - bounds.left;
  const y = opening.top + opening.height / 2 - bounds.top;
  mouthFizz.setAttribute('transform', `translate(${x} ${y})`);
  mouthFizz.style.opacity = reduced ? 0 : .25 + state.pour * .75;
  const p = state.progress;
  const surface = height * (1.12 - state.flood * 1.32);
  const waveAmplitude = 28 + state.flood * 40;
  const phase = p * 15;
  const points = Array.from({ length: 9 }, (_, i) => ({ x: width * i / 8, y: surface + Math.sin(i * 1.45 + phase) * waveAmplitude }));
  let edge = `M -5 ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], point = points[i];
    const middle = (prev.x + point.x) / 2;
    edge += ` C ${middle} ${prev.y - 15}, ${middle} ${point.y + 15}, ${point.x + 5} ${point.y}`;
  }
  pool.setAttribute('d', `${edge} L ${width + 5} ${height + 5} L -5 ${height + 5} Z`);
  poolHighlight.setAttribute('d', edge);

  const amount = state.pour;
  const endX = x + width * .045 * amount;
  const endY = Math.max(y + 20, Math.min(height * .98, y + height * (.23 + .45 * range(p, .12, .31))));
  const spread = Math.max(3, width * .008) * amount;
  const curve = width * .05 * amount;
  if (amount > .001) {
    stream.setAttribute('d', `M ${x - spread * .4} ${y} C ${x + curve} ${y + 20}, ${endX - curve} ${endY - 70}, ${endX - spread} ${endY} Q ${endX} ${endY + 7}, ${endX + spread} ${endY} C ${endX - curve + spread * 2} ${endY - 70}, ${x + curve + spread} ${y + 20}, ${x + spread * .4} ${y} Z`);
    streamHighlight.setAttribute('d', `M ${x} ${y + 5} C ${x + curve} ${y + 35}, ${endX - curve + spread * .5} ${endY - 70}, ${endX} ${endY - 8}`);
  } else { stream.setAttribute('d', ''); streamHighlight.setAttribute('d', ''); }
  stream.style.opacity = amount;
  streamHighlight.style.opacity = amount * .8;
  particles.forEach(({ el, angle, radius }, i) => {
    const travel = .3 + ((p * 7 + i * .113) % 1) * .7;
    el.setAttribute('cx', endX + Math.cos(angle) * radius * travel * amount);
    el.setAttribute('cy', endY + Math.sin(angle) * radius * travel * amount);
    el.setAttribute('rx', (2 + i % 4) * amount);
    el.setAttribute('ry', (3 + i % 6) * amount);
  });
  particleGroup.style.opacity = amount * (1 - range(p, .4, .51));

  const final = range(p, .77, .94);
  const centerX = width * (width <= 650 ? .62 : .73);
  const centerY = height * (width <= 650 ? .76 : .73);
  const radiusX = width * (width <= 650 ? .42 : .27) * final;
  const radiusY = height * .27 * final;
  const rim = Array.from({ length: 72 }, (_, i) => {
    const angle = Math.PI * 2 * i / 72;
    const ripple = 1 + .11 * Math.sin(angle * 7 + final * 2) + .07 * Math.cos(angle * 11);
    return { x: centerX + Math.cos(angle) * radiusX * ripple, y: centerY + Math.sin(angle) * radiusY * ripple };
  });
  const mid = (a, b) => `${((a.x + b.x) / 2).toFixed(2)} ${((a.y + b.y) / 2).toFixed(2)}`;
  let splashPath = `M ${mid(rim[rim.length - 1], rim[0])}`;
  rim.forEach((point, i) => { splashPath += ` Q ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${mid(point, rim[(i + 1) % rim.length])}`; });
  const innerX = Math.max(.01, radiusX * .65), innerY = Math.max(.01, radiusY * .46);
  splashPath += ` Z M ${centerX - innerX} ${centerY} a ${innerX} ${innerY} 0 1 0 ${innerX * 2} 0 a ${innerX} ${innerY} 0 1 0 ${-innerX * 2} 0 Z`;
  splash.setAttribute('fill-rule', 'evenodd');
  splash.setAttribute('d', splashPath);
  splash.style.opacity = final;
}

function render(p) {
  const state = sceneState(p);
  scene.style.setProperty('--tilt', `${state.tilt}deg`);
  scene.style.setProperty('--lift', `${-range(p, .05, .3) * height * .04 + state.finale * height * .015}px`);
  const mobileTiltScale = width <= 650 ? 1 - .27 * range(p, .06, .22) * (1 - range(p, .59, .78)) : 1;
  scene.style.setProperty('--can-scale', (1 - range(p, .39, .56) * .18 + state.finale * .18) * mobileTiltScale);
  can.style.opacity = 1 - envelope(p, .4, .5, .74, .88) * .38;
  const opacity = { hero: state.hero, pour: envelope(p, .13, .19, .26, .31), wave: state.wave, bold: state.bold, fizzy: state.fizzy, fun: state.fun, final: state.finale };
  Object.entries(copies).forEach(([key, element]) => showCopy(element, opacity[key], p));
  $('.scene-progress span').style.transform = `scaleX(${p})`;
  $('.product-stamp').style.opacity = 1 - range(p, .035, .15);
  $('.can-shadow').style.opacity = 1 - state.flood;
  $('.background-type').style.transform = `translateY(${-p * 90}px) rotate(-12deg)`;
  $('.cluster-main').style.translate = `${Math.sin(p * 7) * 20}px ${-p * 70}px`;
  $('.cluster-small').style.translate = `${p * 30}px ${p * 90}px`;
  bubbles.forEach(({ el, i }) => {
    el.style.transform = `translate(${Math.sin(p * 6 + i) * 16}px, ${-p * (80 + i * 8)}px)`;
    el.style.opacity = .25 + .4 * state.flood;
  });
  if (currentChapter !== state.chapter) {
    chapters.forEach((button, i) => i === state.chapter ? button.setAttribute('aria-current', 'step') : button.removeAttribute('aria-current'));
    currentChapter = state.chapter;
  }
  drawLiquid(state);
  lastProgress = p;
}

function schedule() {
  if (requestedFrame) return;
  requestedFrame = requestAnimationFrame(() => {
    requestedFrame = 0;
    const p = reduced ? 0 : clamp((scrollY - trackTop) / distance);
    if (p !== lastProgress) render(p);
  });
}
function measure() {
  const rect = scene.getBoundingClientRect();
  width = rect.width; height = rect.height;
  trackTop = track.getBoundingClientRect().top + scrollY;
  distance = Math.max(1, track.offsetHeight - height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  lastProgress = -1;
  schedule();
}
function jump(progress) {
  const destination = reduced && progress > 0 ? $('#after-pour').offsetTop : trackTop + distance * progress;
  scrollTo({ top: destination, behavior: reduced ? 'instant' : 'smooth' });
}
document.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault(); jump(Number(button.dataset.jump));
}));

function setMotion(value) {
  const oldProgress = distance ? clamp((scrollY - trackTop) / distance) : 0;
  reduced = value;
  document.body.classList.toggle('reduced-motion', reduced);
  $('#motion-toggle').setAttribute('aria-pressed', String(reduced));
  $('#motion-toggle').textContent = reduced ? 'ENABLE SCROLL EXPERIENCE' : 'REDUCE MOTION';
  measure();
  if (oldProgress > 0 && scrollY < trackTop + distance + height) jump(0);
}
$('#motion-toggle').addEventListener('click', () => setMotion(!reduced));
const onMediaChange = event => setMotion(event.matches);
media.addEventListener('change', onMediaChange);

const moments = {
  chill: ['THE ORIGINAL CHILL.', 'A tall glass, plenty of ice, and chilled grape soda. Sometimes the simplest things hit just right.', '250 ml grape soda + 4 ice cubes. Pour slowly. Enjoy immediately.', '✳'],
  twist: ['A BRIGHT LITTLE TWIST.', 'Big grape flavour with a fresh squeeze of lime. Your afternoon break, with a little extra zing.', '250 ml grape soda + 4 ice cubes + 2 lime wedges. Squeeze, pour and stir gently.', '✧'],
  float: ['FLOAT INTO THE WEEKEND.', 'Creamy vanilla meets wildly fizzy grape. A spoon-and-straw kind of treat, made for taking it easy.', '200 ml grape soda + 1 scoop vanilla ice cream. Pour slowly down the side of a tall glass.', '◉']
};
const tabs = [...document.querySelectorAll('[data-moment]')];
function selectMoment(button) {
  tabs.forEach(tab => { const active = tab === button; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
  const [title, description, recipe, icon] = moments[button.dataset.moment];
  $('#moment-title').textContent = title; $('#moment-description').textContent = description;
  $('#moment-recipe').textContent = recipe; $('.moment-icon').textContent = icon;
  $('#moment-panel').setAttribute('aria-labelledby', button.id);
}
tabs.forEach((button, i) => {
  button.addEventListener('click', () => selectMoment(button));
  button.addEventListener('keydown', event => {
    const index = event.key === 'ArrowRight' ? (i + 1) % tabs.length : event.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (index === null) return;
    event.preventDefault(); selectMoment(tabs[index]); tabs[index].focus();
  });
});
const dialog = $('#explore-dialog');
document.querySelectorAll('[data-explore]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
$('#try-ideas').addEventListener('click', () => {
  dialog.close(); $('#after-pour').scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
  tabs[0].focus({ preventScroll: true });
});

addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', measure, { passive: true });
addEventListener('pageshow', measure);
document.fonts.ready.then(measure);
setMotion(reduced);
// Compositor-only fizz stops when the scene leaves the viewport or the tab is hidden.
let sceneVisible = true;
const pauseFizz = () => scene.classList.toggle('scene-paused', !sceneVisible || document.hidden);
const observer = new IntersectionObserver(([entry]) => { sceneVisible = entry.isIntersecting; pauseFizz(); });
observer.observe(scene);
document.addEventListener('visibilitychange', pauseFizz);
// Module initialization runs once; listeners are released when this document is discarded.
