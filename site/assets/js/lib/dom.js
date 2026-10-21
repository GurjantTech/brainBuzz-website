/** Tiny DOM helpers shared by the site script and the games. */

export const ICONS = '/assets/img/icons.svg';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** <svg class="icon"><use href="…#name"></svg>, decorative by default. */
export function icon(name, cls = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', `icon${cls ? ` ${cls}` : ''}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `${ICONS}#${name}`);
  svg.appendChild(use);
  return svg;
}

/**
 * h('button.btn.btn-primary', { onclick, type: 'button' }, 'Text', child)
 * Attributes starting with "on" become listeners; `class`, `style`, `dataset` and booleans are handled.
 */
export function h(tag, attrs = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = [el.className, v].filter(Boolean).join(' ');
    else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'text') el.textContent = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export const formatNumber = (n) => Math.round(n).toLocaleString('en-US');

export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Time until local midnight as h:mm:ss (the app's "Next challenge in" countdown). */
export function untilMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const total = Math.max(0, Math.floor((next - now) / 1000));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Arrow-key navigation between the buttons of a grid board. Buttons stay in the tab order,
 * so Tab still works; arrows just make moving around a big grid quicker.
 */
export function gridKeys(container, columns) {
  container.addEventListener('keydown', (e) => {
    const cols = typeof columns === 'function' ? columns() : columns;
    const keys = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
    if (!(e.key in keys)) return;
    const items = Array.from(container.querySelectorAll('[data-cell]'));
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const next = items[i + keys[e.key]];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  });
}
