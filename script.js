const grid = document.getElementById('grid');
const headerContent = document.querySelector('.header-content');
const resultArea = document.querySelector('.result-area');
const clearBtn = document.getElementById('clear-btn');
// clear button behavior
if (clearBtn) clearBtn.addEventListener('click', () => {
  // clear all active
  activeSet.clear();
  document.querySelectorAll('.circle.active').forEach(c => c.classList.remove('active'));
  renderPressed();
});

// keep a Set of active (pressed) numbers for quick lookup and ordered array for display
const activeSet = new Set();

for (let i = 1; i <= 25; i++) {
  const circle = document.createElement('div');
  circle.className = 'circle';
  circle.dataset.value = String(i);
  circle.onclick = () => interactCircle(circle);

  const text = document.createElement('span');
  text.className = 'circle-text';
  text.textContent = i;

  circle.appendChild(text);
  grid.appendChild(circle);
}

// no grid scaling feature — nothing to apply on load

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore registration failure */ });
  });
}

// Install prompt flow: capture beforeinstallprompt and show a custom button
let deferredPrompt = null;
const installBtn = document.getElementById('install-btn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-flex';
});
if (installBtn) installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

function renderPressed() {
  // Show the pressed numbers as pill elements inside the header
  if (!headerContent) return;

  const headerFrame = document.querySelector('.header-frame');

  const values = Array.from(activeSet).sort((a, b) => a - b);
  // Clear previous content
  if (!resultArea) return;
  resultArea.innerHTML = '';

  // update the pressed count display under the grid
  try {
  const countEl = document.querySelector('.count-text');
  if (countEl) countEl.textContent = `Processed: ${values.length}`;
  } catch (e) { /* ignore */ }

  if (values.length === 0) {
    const emptyText = 'No selections';
  resultArea.textContent = '';
  const span = document.createElement('span');
  span.className = 'pressed-text';
  span.textContent = emptyText;
  resultArea.appendChild(span);
    // accessibility / tooltip: show full text on hover and to screen readers
  resultArea.title = emptyText;
  resultArea.setAttribute('aria-label', emptyText);
  resultArea.setAttribute('role', 'status');
  resultArea.setAttribute('aria-live', 'polite');
  // update cursor to indicate not clickable when empty
  resultArea.style.cursor = 'default';
    // remove visual selection state on header
  if (headerFrame) headerFrame.classList.remove('has-selection');
    // header height will grow if the text wraps; font-size is controlled by CSS
    return;
  }

  // Always show comma-separated values, but compress consecutive runs into ranges
  const full = compressRanges(values);
  resultArea.textContent = '';
  const span = document.createElement('span');
  span.className = 'pressed-text';
  span.textContent = full;
  resultArea.appendChild(span);
  // accessibility / tooltip: set the full text for hover and screen readers
  resultArea.title = full;
  resultArea.setAttribute('aria-label', full);
  resultArea.setAttribute('role', 'status');
  resultArea.setAttribute('aria-live', 'polite');

  // when there are results make the result-area clickable
  resultArea.style.cursor = 'pointer';

  // add visual selection state to header
  if (headerFrame) headerFrame.classList.add('has-selection');

  // header height will grow if the text wraps; font-size is controlled by CSS
  // ensure pressed-area text fits on a single line by shrinking font if necessary
  fitTextToWidth(resultArea.querySelector('.pressed-text') || resultArea, document.querySelector('.header-frame'));
  // ensure clear button matches the pressed-area height
  matchClearButtonHeight();
}

// set the clear button height to match the pressed-area (so 'C' lines up)
function matchClearButtonHeight() {
  const pa = document.querySelector('.result-area');
  const btn = document.getElementById('clear-btn');
  if (!pa || !btn) return;
  const h = Math.max(44, Math.round(pa.getBoundingClientRect().height));
  // use inline-flex to vertically center content
  btn.style.display = 'inline-flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.height = h + 'px';
}

// fitTextToWidth: shrink font until the element's content fits on one line
function fitTextToWidth(el, container) {
  if (!el || !container) return;
  // reset inline size to pick up CSS base
  el.style.fontSize = '';
  const rect = container.getBoundingClientRect();
  const available = Math.max(20, Math.floor(rect.width - 8)); // account for small paddings
  const computed = window.getComputedStyle(el);
  const base = Math.ceil(parseFloat(computed.fontSize) || 16);

  // min/max from CSS vars if present. If no CSS var, default to 0.7rem (in px)
  const root = window.getComputedStyle(document.documentElement);
  const rootFontSize = parseFloat(root.fontSize) || 16;
  const minCssVar = root.getPropertyValue('--pressed-min-font');
  const minCss = minCssVar ? parseFloat(minCssVar) : Math.round(0.7 * rootFontSize);

  // natural max is circle font size
  const circle = document.querySelector('.circle-text');
  const circleSize = circle ? Math.ceil(parseFloat(window.getComputedStyle(circle).fontSize) || base) : base;
  const maxPx = circleSize;
  let lo = Math.max(10, Math.floor(minCss));
  let hi = Math.max(lo, maxPx);

  function fits(size) {
    el.style.fontSize = size + 'px';
    return el.scrollWidth <= available;
  }

  if (fits(hi)) return;
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) { best = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  el.style.fontSize = best + 'px';
}



// compress sorted array of numbers into a string where consecutive runs become "start-end"
// example: [1,2,3,5,6,9] -> "1-3,5-6,9"
function compressRanges(nums) {
  if (!nums || nums.length === 0) return '';
  const parts = [];
  let start = nums[0];
  let end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    if (n === end + 1) {
      end = n;
    } else {
      parts.push(start === end ? String(start) : `${start}-${end}`);
      start = n;
      end = n;
    }
  }
  // push the last range
  parts.push(start === end ? String(start) : `${start}-${end}`);
  return parts.join(', ');
}

function interactCircle(element) {
  const val = Number(element.dataset.value);
  element.classList.toggle('active');

  if (element.classList.contains('active')) activeSet.add(val);
  else activeSet.delete(val);

  // trigger one-shot glow when a circle is pressed (i.e., becomes active)
  const headerFrame = document.querySelector('.header-frame');
  if (element.classList.contains('active') && headerFrame) {
    headerFrame.classList.add('glow-once');
    // ensure glow-once is removed after the CSS animation so it can be retriggered
    setTimeout(() => headerFrame.classList.remove('glow-once'), 1000);
  }

  renderPressed();
}

// initial render
renderPressed();


// helper: debounce to avoid running expensive layout code too often during resize
function debounce(fn, wait = 120) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, wait);
  };
}

// Combined resize handler: adjust pressed-text font and clear button height
const onResize = debounce(() => {
  try {
    // ensure pressed text fits inside header frame
    const pressed = (resultArea && resultArea.querySelector('.pressed-text')) || resultArea;
    const headerFrame = document.querySelector('.header-frame');
    if (pressed && headerFrame) fitTextToWidth(pressed, headerFrame);
  } catch (e) { /* ignore */ }
  matchClearButtonHeight();
}, 120);

window.addEventListener('load', () => matchClearButtonHeight());
window.addEventListener('resize', onResize);

// Ensure the grid fits vertically without causing the page to scroll.
function updateAvailableGridSize() {
  const root = document.documentElement;
  // Measure header and clear button heights to compute a safe max square size
  const header = document.querySelector('.header-frame');
  const clear = document.getElementById('clear-btn');
  const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 80;
  const clearH = clear ? Math.ceil(clear.getBoundingClientRect().height) : 0;
  const margin = 24; // breathing room between sections
  const available = Math.max(120, Math.floor(window.innerHeight - headerH - clearH - margin));
  root.style.setProperty('--available-grid-size', available + 'px');
}

const onResizeAll = debounce(() => {
  onResize();
  updateAvailableGridSize();
}, 140);

window.addEventListener('load', () => { updateAvailableGridSize(); });
window.addEventListener('resize', onResizeAll);

/* popup/reopen logic removed per user request */


// copy pressed-area content to clipboard when clicked
if (resultArea) {
  resultArea.style.cursor = 'pointer';
  resultArea.addEventListener('click', async (e) => {
    const raw = (resultArea.textContent || '').trim();
    // don't copy when nothing is selected
    if (!raw || raw.toLowerCase() === 'no selections') {
      // show a brief warning tooltip
      let warn = resultArea.querySelector('.copy-tooltip-warning');
      if (!warn) {
        warn = document.createElement('span');
        warn.className = 'copy-tooltip warning copy-tooltip-warning';
        warn.textContent = 'No selections to copy';
        resultArea.appendChild(warn);
      }
      warn.classList.add('visible');
      setTimeout(() => warn.classList.remove('visible'), 1000);
      return;
    }
    const copyText = `Processed: ${raw}`;
    try {
      await navigator.clipboard.writeText(copyText);
      // success: no tooltip shown per request
    } catch (err) {
      // fallback: attempt execCommand
      const ta = document.createElement('textarea');
      ta.value = copyText;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        // success: no tooltip shown per request
      } catch (e) {
        /* ignore */
      }
      ta.remove();
    }
  });
}
