/* Móar v4: MontRural's measured motion (split-line reveals that play once, photos settling from 1.21 to 1,
   0.2/0.3s UI), the rental-format chooser, the menu, and the SNDR Bókun range calendar mounted inline with a
   "your selection" panel. Nothing on this page sends or books anything. Native scroll. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const motion = () => root.classList.contains('motion-on');
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- split paragraphs into masked lines (undone after the reveal so text reflows freely) ---------- */
  function split(el) {
    const text = el.dataset.text || (el.dataset.text = el.textContent.trim().replace(/\s+/g, ' '));
    el.innerHTML = text.split(' ').map((w) => `<span class="wd">${esc(w)}</span>`).join(' ');
    const lines = []; let top = null;
    $$('.wd', el).forEach((s) => { const t = s.offsetTop; if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; } lines[lines.length - 1].push(s.textContent); });
    el.innerHTML = lines.map((l) => `<span class="ln"><span>${esc(l.join(' '))}</span></span>`).join('');
  }
  const unsplit = (el) => { if (el.dataset.text) el.textContent = el.dataset.text; el.dataset.done = '1'; };
  function index(box, start = 0) { $$('.w > span, .ln > span', box).forEach((s, i) => s.style.setProperty('--i', start + i)); }
  const lineEls = $$('[data-lines]');
  function splitAll() { lineEls.forEach((el) => { if (!el.dataset.done) split(el); }); $$('[data-rv]:not([data-rv="hero"])').forEach((b) => index(b)); }

  /* ---------- reveals: once, on entry ---------- */
  function reveal(box) {
    if (box.classList.contains('is-in')) return;
    box.classList.add('is-in');
    const ls = [box, ...$$('[data-lines]', box)].filter((e) => e.matches('[data-lines]') && !e.dataset.done);
    if (ls.length) { const n = $$('.w > span, .ln > span', box).length; setTimeout(() => ls.forEach(unsplit), 1600 + n * 100); }
  }

  function start() {
    if (motion()) splitAll();
    // the hero: header, headline, meta, plate, then the buttons
    const hd = $('.hd'), h1 = $('.hero-h'), meta = $('.hero-meta'), plate = $('.ph--hero'), cta = $('.hero-cta');
    index(h1, 0); index(meta, 4);
    h1.style.setProperty('--d', '.15s'); meta.style.setProperty('--d', '.15s'); plate.style.setProperty('--pd', '.3s');
    window.__moReady = true;
    let shown = false; const show = () => { if (shown) return; shown = true; [hd, h1, meta, plate, cta].forEach(reveal); };
    requestAnimationFrame(() => requestAnimationFrame(show)); setTimeout(show, 120);   // a background tab never paints a frame
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -14% 0px' });
    const boxes = $$('[data-rv]:not([data-rv="hero"]), .panels');
    boxes.forEach((b) => io.observe(b));
    // a refresh mid-page: whatever is already above the viewport has been seen, so it is shown, not held back
    const above = () => boxes.forEach((b) => { if (b.getBoundingClientRect().bottom < 0) reveal(b); });
    above(); addEventListener('scroll', above, { once: true, passive: true });
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!motion()) return; lineEls.forEach((el) => { if (!el.dataset.done && !el.closest('.is-in')) split(el); }); $$('[data-rv]:not(.is-in):not([data-rv="hero"])').forEach((b) => index(b)); }, 160); });
  }
  if (motion()) {
    const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
    fonts.then(start);
  } else { window.__moReady = true; $$('[data-rv], .panels, .hd').forEach((b) => b.classList.add('is-in')); }

  // the reduced-motion preference switched on while the page is open: show everything as it stands
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => { if (e.matches) { root.classList.remove('motion-on'); $$('[data-lines]').forEach(unsplit); } });

  // the page end is moss: let the canvas under Safari's toolbar match it
  new IntersectionObserver(([e]) => root.classList.toggle('at-end', e.isIntersecting)).observe($('.ft'));

  /* ---------- the compact bar after the hero ---------- */
  const bar = $('#bar'), meta = $('.hero-meta');
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0;
    if (!on && bar.contains(document.activeElement)) $('.hd-logo').focus({ preventScroll: true });   // never strand focus in a hidden bar
    bar.classList.toggle('is-on', on); bar.toggleAttribute('inert', !on); bar.setAttribute('aria-hidden', String(!on));
  }).observe(meta);

  /* ---------- menu: nothing highlighted on a pointer open (focus the sheet), first link on a keyboard open ---------- */
  const menu = $('#menu'), openers = $$('[data-menu-open]');
  let opener = null, closeT = 0;
  $$('.mi', menu).forEach((m, i) => m.style.setProperty('--i', i));
  function openMenu(e) {
    clearTimeout(closeT); opener = e.currentTarget;
    menu.hidden = false; void menu.offsetWidth; menu.classList.add('is-open');
    openers.forEach((b) => b.setAttribute('aria-expanded', 'true'));
    document.body.style.overflow = 'hidden';
    if (e.detail === 0) $('a', menu).focus({ preventScroll: true }); else menu.focus({ preventScroll: true });
  }
  function closeMenu(back = true) {
    if (menu.hidden) return;
    menu.classList.remove('is-open'); openers.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    document.body.style.overflow = '';
    closeT = setTimeout(() => { menu.hidden = true; }, 320);
    if (back && opener) opener.focus({ preventScroll: true });
  }
  openers.forEach((b) => b.addEventListener('click', openMenu));
  $('[data-menu-close]', menu).addEventListener('click', () => closeMenu());
  $$('.menu-nav a', menu).forEach((a) => a.addEventListener('click', () => closeMenu(false)));
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('a, button', menu), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === menu)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- the chooser: tabs swap the whole panel (0.3s crossfade, title lines replay) ---------- */
  const tabs = $$('.tab'), panels = $$('.panel');
  panels.forEach((p) => $$('.w > span', p).forEach((s, i) => s.style.setProperty('--i', i)));
  function choose(stay, focus = false) {
    tabs.forEach((t) => { const on = t.dataset.stay === stay; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    panels.forEach((p) => {
      const on = p.id === 'panel-' + stay;
      if (on === p.classList.contains('is-active')) return;
      if (on) {
        p.classList.add('pre', 'is-active'); p.removeAttribute('aria-hidden'); p.inert = false;
        void p.offsetWidth; requestAnimationFrame(() => p.classList.remove('pre'));
      } else { p.classList.remove('is-active', 'pre'); p.setAttribute('aria-hidden', 'true'); p.inert = true; }
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => choose(t.dataset.stay));
    t.addEventListener('keydown', (e) => {
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n === undefined) return; e.preventDefault();
      choose(tabs[(n + tabs.length) % tabs.length].dataset.stay, true);
    });
  });
  $$('[data-gal]').forEach((g) => {
    const items = $$('.gal-i', g), n = $('.gal-n', g); let at = 0;
    const go = (d) => { items[at].classList.remove('is-on'); at = (at + d + items.length) % items.length; items[at].classList.add('is-on'); n.textContent = `${at + 1} / ${items.length}`; };
    $$('[data-gal-step]', g).forEach((b) => b.addEventListener('click', () => go(+b.dataset.galStep)));
    let x0 = null;
    g.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' && !e.target.closest('button')) x0 = e.clientX; });
    g.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) go(e.clientX < x0 ? 1 : -1); x0 = null; });
    g.addEventListener('pointercancel', () => { x0 = null; });
  });

  /* ---------- booking: the SNDR Bókun range calendar inline + "your selection" ---------- */
  const STAYS = {
    cottage: { name: 'Log cottage', max: 3, from: 129, img: 'assets/img/a/hero-sm.webp', cap: 'A log cottage sleeps up to three. More of you? Book a second cottage.' },
    guest: { name: 'Guesthouse room', max: 4, from: 149, img: 'assets/img/guesthouse-row-sm.webp', cap: 'A guesthouse room sleeps up to four.' },
  };
  const box = $('#inline-booking'), sel = $('.sel');
  let stay = 'cottage', dates = [];
  const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const at = (k) => new Date(k + 'T12:00');
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  if (box && window.mountBooking) {
    const engine = window.mountBooking(box, { min: 1, max: STAYS.cottage.max, guests: 2, months: 18, lang: 'en', capNote: () => STAYS[stay].cap, actionText: 'Check these dates', sumNote: 'Next, Móar\'s own booking page confirms the price.' });
    engine.prepare();
    const guests = () => parseInt($('.bk-n', box).textContent, 10) || 1;
    const setReady = (on) => { sel.dataset.state = on ? 'ready' : 'idle'; $('[data-sel-go]', sel).hidden = !on; };
    function paintSel() {
      const s = STAYS[stay];
      $('[data-sel-name]', sel).textContent = s.name;
      $('[data-sel-price]', sel).textContent = eur.format(s.from);
      const img = $('[data-sel-img]', sel); if (!img.src.endsWith(s.img)) img.src = s.img;
      $('[data-sel-from]', sel).textContent = dates[0] ? fmt.format(at(dates[0])) : 'Choose a date';
      $('[data-sel-to]', sel).textContent = dates[1] ? fmt.format(at(dates[1])) : 'Choose a date';
      const n = dates.length === 2 ? Math.round((at(dates[1]) - at(dates[0])) / 864e5) : 0;
      $('[data-sel-n]', sel).textContent = n ? `${n} night${n > 1 ? 's' : ''}` : ' ';
      const g = guests(); $('[data-sel-g]', sel).textContent = `${g} guest${g > 1 ? 's' : ''}`;
    }
    function setStay(s) {
      if (!STAYS[s] || s === stay) return;
      stay = s; const r = $(`input[name=stay][value="${s}"]`, box); if (r) r.checked = true;
      engine.setMax(STAYS[s].max); setReady(false); paintSel();
    }
    $$('input[name=stay]', box).forEach((i) => i.addEventListener('change', () => setStay(i.value)));
    // the engine owns the range; mirror it from the day buttons, the way the live sites do
    box.addEventListener('click', (e) => {
      const day = e.target.closest('.bk-d:not(:disabled)');
      if (day) { const k = day.dataset.d; dates = (!dates.length || dates.length === 2 || k <= dates[0]) ? [k] : [dates[0], k]; }
      if (e.target.closest('.bk-d, .bk-minus, .bk-plus')) { setReady(false); paintSel(); }
    });
    // ancestor capture: runs before the engine's own submit handler (which would ask for name and email)
    box.addEventListener('submit', (e) => {
      if (dates.length !== 2) return;
      e.preventDefault(); e.stopPropagation();
      paintSel(); setReady(true);
      const h = $('#sel-h'); h.focus({ preventScroll: true });
      if (matchMedia('(max-width: 960px)').matches) $('[data-sel-go]', sel).scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'center' });
    }, true);
    // the chooser's Book buttons arrive with a stay in mind
    $$('[data-book-stay]').forEach((a) => a.addEventListener('click', (e) => { setStay(a.dataset.bookStay); if (e.detail === 0) setTimeout(() => $('input[name=stay]:checked', box).focus({ preventScroll: true }), 50); }));
    $$('[data-check]').forEach((a) => a.addEventListener('click', (e) => { if (e.detail === 0) setTimeout(() => engine.firstDay()?.focus({ preventScroll: true }), 50); }));
    paintSel();
  }
})();
