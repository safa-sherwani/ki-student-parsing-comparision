'use strict';

const byId = id => document.getElementById(id);
const ui = Object.fromEntries([
  'book', 'page', 'prev', 'next', 'total', 'paired', 'page-title',
  'page-label', 'scan', 'scan-status', 'scan-well', 'zoom', 'left', 'right',
  'panels', 'theme', 'diff', 'error', 'enlarged', 'large-scan', 'enlarged-title', 'magnify',
].map(id => [id, byId(id)]));

const labels = {
  biology_bahdini_g12: { name: 'Biology', language: 'Bahdini', lang: 'kmr-Arab' },
  mathematics_sorani_g12: { name: 'Mathematics', language: 'Sorani', lang: 'ckb' },
  physics_arabic_g12: { name: 'Physics', language: 'Arabic', lang: 'ar' },
  sunrise_english_g12: { name: 'Sunrise', language: 'English', lang: 'en' },
};

const colorScheme = matchMedia('(prefers-color-scheme: light)');
let books = [];
let available = [];
let renderVersion = 0;
const themeButtons = ui.theme.querySelectorAll('button');
let themeChoice = 'system';

function applyTheme() {
  document.documentElement.dataset.theme =
    themeChoice === 'system' ? (colorScheme.matches ? 'light' : 'dark') : themeChoice;
  for (const button of themeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === themeChoice));
  }
}

try {
  const saved = localStorage.getItem('kis-theme');
  if (['light', 'dark', 'system'].includes(saved)) themeChoice = saved;
} catch { /* Browsing with storage disabled still supports switching themes. */ }
applyTheme();
colorScheme.addEventListener('change', applyTheme);
for (const button of themeButtons) {
  button.addEventListener('click', () => {
    themeChoice = button.dataset.themeChoice;
    applyTheme();
    try { localStorage.setItem('kis-theme', themeChoice); } catch {}
  });
}

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not open ${path}`);
  return response.json();
}

function status(node, message) {
  const paragraph = document.createElement('p');
  paragraph.className = 'empty';
  paragraph.textContent = message;
  node.dir = 'ltr';
  node.lang = 'en';
  node.replaceChildren(paragraph);
}

function displayOutput(node, output, language) {
  if (!output?.text.trim()) {
    status(node, 'No text output is available for this model on this page.');
    return;
  }
  node.dir = ['ltr', 'rtl'].includes(output.direction) ? output.direction : 'auto';
  node.lang = language;
  if (!output.runs) {
    node.textContent = output.text;
    return;
  }
  node.replaceChildren(...output.runs.map(([content, changed]) => {
    if (!changed) return document.createTextNode(content);
    const highlight = document.createElement('mark');
    highlight.textContent = content;
    return highlight;
  }));
}

function linkToPage(book, page, replace) {
  const url = new URL(location.href);
  url.searchParams.set('book', book);
  url.searchParams.set('page', page);
  url.searchParams.delete('show');
  if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState'](null, '', url);
}

async function render({ link = true, replace = false } = {}) {
  const book = books.find(item => item.id === ui.book.value);
  const page = available[ui.page.selectedIndex];
  if (!page || !book) return;

  const version = ++renderVersion;
  const { name, lang } = labels[book.id];
  const scanLabel = `${name}, PDF page ${page.page}`;
  if (link) linkToPage(book.id, page.page, replace);
  ui['page-title'].textContent = `${name} · Page ${page.page}`;
  const details = [`Sample ${ui.page.selectedIndex + 1} of ${available.length}`];
  if (page.printed) details.push(`Printed page ${page.printed}`);
  details.push(['No extracted text', 'One model output', 'Both model outputs'][page.outputs ?? 0]);
  ui['page-label'].textContent = details.join(' · ');
  ui.prev.disabled = ui.page.selectedIndex === 0;
  ui.next.disabled = ui.page.selectedIndex === available.length - 1;
  ui.diff.disabled = true;
  ui.panels.classList.remove('show-diff');
  ui.zoom.disabled = true;
  ui.scan.hidden = true;
  ui.scan.removeAttribute('src');
  if (ui.enlarged.open) ui.enlarged.close();
  ui['scan-well'].scrollTop = 0;
  ui['scan-status'].hidden = false;
  ui['scan-status'].textContent = 'Loading scan…';
  const outputs = [ui.left, ui.right];
  for (const output of outputs) {
    output.scrollTop = 0;
    status(output, 'Loading output…');
  }

  const pagePath = `data/${book.id}-p${page.page}`;
  ui.scan.src = `${pagePath}.webp`;
  ui.scan.alt = scanLabel;
  const imageRequest = ui.scan.decode().then(() => {
    if (version !== renderVersion) return;
    ui.scan.hidden = false;
    ui['scan-status'].hidden = true;
    ui.zoom.disabled = false;
  }).catch(() => {
    if (version === renderVersion) ui['scan-status'].textContent = 'The scan could not load. Reload to try again.';
  });
  const outputRequest = loadJSON(`${pagePath}.json`)
    .then(pair => {
      if (version !== renderVersion) return;
      outputs.forEach((output, index) => displayOutput(output, pair[index], lang));
      ui.diff.disabled = page.outputs !== 2;
      ui.panels.classList.toggle('show-diff', ui.diff.checked && !ui.diff.disabled);
    }).catch(() => {
      if (version === renderVersion) outputs.forEach(output => status(output, 'The output could not load. Reload to try again.'));
    });
  await Promise.all([imageRequest, outputRequest]);
}

function setPages(requested, options) {
  const book = books.find(item => item.id === ui.book.value);
  available = book.pages;
  ui.page.replaceChildren(...available.map(({ page }) => new Option(String(page), page)));
  const index = requested ? available.findIndex(page => page.page >= requested) :
    available.findIndex(page => page.outputs === 2);
  ui.page.selectedIndex = index === -1 ? (requested ? available.length - 1 : 0) : index;
  return render(options);
}

function restore(options) {
  const params = new URLSearchParams(location.search);
  ui.book.value = books.some(book => book.id === params.get('book')) ? params.get('book') : books[0].id;
  const requested = Number(params.get('page'));
  return setPages(Number.isInteger(requested) && requested > 0 ? requested : 0, options);
}

ui.book.addEventListener('change', () => setPages());
ui.page.addEventListener('change', () => render());
for (const [button, step] of [[ui.prev, -1], [ui.next, 1]]) {
  button.addEventListener('click', () => {
    ui.page.selectedIndex += step;
    render();
  });
}
window.addEventListener('popstate', () => { if (books.length) restore({ link: false }); });
ui.diff.addEventListener('change', () => {
  ui.panels.classList.toggle('show-diff', ui.diff.checked);
  if (ui.diff.checked && ui.panels.dataset.view === 'scan' && matchMedia('(max-width: 850px)').matches) {
    document.querySelector('.phone-controls [data-view="models"]').click();
  }
});
const views = document.querySelectorAll('.phone-controls button');
for (const button of views) {
  button.addEventListener('click', () => {
    ui.panels.dataset.view = button.dataset.view;
    for (const item of views) item.setAttribute('aria-pressed', String(item === button));
  });
}
ui.zoom.addEventListener('click', () => {
  ui['enlarged-title'].textContent = ui.scan.alt;
  ui['large-scan'].alt = ui.scan.alt;
  ui['large-scan'].src = ui.scan.src;
  ui.enlarged.showModal();
});
ui.magnify.addEventListener('click', () => {
  const zoomed = ui.enlarged.classList.toggle('magnified');
  ui.magnify.setAttribute('aria-pressed', String(zoomed));
});
ui.enlarged.addEventListener('close', () => {
  ui.enlarged.classList.remove('magnified');
  ui.magnify.setAttribute('aria-pressed', 'false');
  ui['large-scan'].removeAttribute('src');
});

async function init() {
  try {
    books = await loadJSON('data/books.json');
    ui.total.textContent = books.reduce((sum, book) => sum + book.pages.length, 0);
    ui.paired.textContent = books.reduce((sum, book) => sum + book.pages.filter(page => page.outputs === 2).length, 0);
    ui.book.replaceChildren(...books.map(({ id }) =>
      new Option(`${labels[id].name} · ${labels[id].language}`, id)));
    for (const field of [ui.book, ui.page]) field.disabled = false;
    restore({ replace: true });
  } catch {
    ui['page-title'].textContent = 'Page browser';
    ui.error.hidden = false;
    ui.error.textContent = 'The page catalog could not load. Open this app through a web server and try again.';
  }
}
init();
