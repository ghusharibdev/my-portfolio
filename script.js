/* ---------- per-project flow diagrams ---------- */
/* Each project gets a small "stage → stage → stage" schematic, styled after
   the site's node/pulse motif, scaled responsively via SVG viewBox. */
const FLOWS = {
  careerlens:   { stages: ['résumé', 'rag match', 'score'] },
  subsentry:    { stages: ['subscribe', 'track', 'alert'] },
  mediqueue:    { stages: ['patient', 'queue', 'served'] },
  spendwise:    { stages: ['expense', 'budget', 'summary'] },
  jobboard:     { stages: ['profile', 'listing', 'hired'] },
  travel:       { stages: ['search', 'forecast', 'save'] },
  climivo:      { stages: ['weather', 'score', 'guidance'] },
  rxshield:     { stages: ['medication', 'schedule', 'insights'] },
  duel:         { stages: ['match', 'answer', 'score'] },
  aajkarate:    { stages: ['scrape', 'cache', 'notify'] },
  patientmgmt:  { stages: ['patient', 'kafka', 'billing'] },
};

function buildFlow(container){
  const key = container.dataset.flow;
  const config = FLOWS[key];
  if (!config) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stages = config.stages;
  const n = stages.length;

  const vbW = 300;
  const vbH = 64;
  const nodeW = 78;
  const nodeH = 34;
  const y = vbH / 2 - nodeH / 2;
  const gap = (vbW - n * nodeW) / (n - 1);

  const xs = stages.map((_, i) => i * (nodeW + gap));
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', stages.join(' to '));

  // connector lines
  for (let i = 0; i < n - 1; i++){
    const x1 = xs[i] + nodeW;
    const x2 = xs[i + 1];
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('class', 'path');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', vbH / 2);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', vbH / 2);
    svg.appendChild(line);

    if (!reduced){
      const pulse = document.createElementNS(svgNS, 'circle');
      pulse.setAttribute('class', 'pulse');
      pulse.setAttribute('r', 3);
      const anim = document.createElementNS(svgNS, 'animateMotion');
      anim.setAttribute('dur', '2.4s');
      anim.setAttribute('repeatCount', 'indefinite');
      anim.setAttribute('begin', `${i * 0.5}s`);
      anim.setAttribute('path', `M${x1},${vbH / 2} L${x2},${vbH / 2}`);
      pulse.appendChild(anim);
      svg.appendChild(pulse);
    }
  }

  // nodes
  stages.forEach((label, i) => {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'node' + (i === Math.floor((n - 1) / 2) ? ' is-core' : '') + (i === n - 1 ? ' is-end' : ''));

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', xs[i]);
    rect.setAttribute('y', y);
    rect.setAttribute('width', nodeW);
    rect.setAttribute('height', nodeH);
    rect.setAttribute('rx', 4);
    g.appendChild(rect);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', xs[i] + nodeW / 2);
    text.setAttribute('y', vbH / 2 + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'node-label');
    text.setAttribute('font-size', '10');
    text.textContent = label;
    g.appendChild(text);

    svg.appendChild(g);
  });

  container.appendChild(svg);
}

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.flow[data-flow]').forEach(buildFlow);

  /* ---------- cursor glow ---------- */
  // pointer only: no cursor on touch to trail, and a tapped glow would linger
  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    let gx = 0;
    let gy = 0;
    let glowQueued = false;
    let glowStarted = false;

    function placeGlow(){
      glowQueued = false;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    }

    window.addEventListener('pointermove', (e) => {
      // ignore the synthetic move some pens emit on hover without contact
      if (e.pointerType === 'touch') return;
      gx = e.clientX;
      gy = e.clientY;
      if (!glowStarted){
        glowStarted = true;
        glow.classList.add('is-on');
        placeGlow();
      }
      if (glowQueued) return;
      glowQueued = true;
      requestAnimationFrame(placeGlow);
    }, { passive: true });

    // fade out when the pointer leaves the window entirely
    document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
    window.addEventListener('blur', () => glow.classList.remove('is-on'));
  }

  /* ---------- theme toggle ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  // what is actually showing right now, whether pinned or inherited
  const currentTheme = () => {
    const pinned = root.getAttribute('data-theme');
    if (pinned === 'light' || pinned === 'dark') return pinned;
    return systemDark.matches ? 'dark' : 'light';
  };

  const syncToggleLabel = () => {
    if (!themeToggle) return;
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${next} theme`);
  };

  if (themeToggle){
    themeToggle.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
      syncToggleLabel();
    });
    syncToggleLabel();
  }

  // keeps the button honest when the OS theme flips under an unpinned visitor
  systemDark.addEventListener('change', syncToggleLabel);

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu){
    const closeMenu = () => {
      mobileMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')){
        closeMenu();
        navToggle.focus();
      }
    });
  }

  const sections = ['hero', 'about', 'skills', 'experience', 'work', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  // both the dot nav and the top nav carry data-section, so one pass covers them
  const navLinks = Array.from(document.querySelectorAll('[data-section]'));

  function setActive(id){
    navLinks.forEach(a => {
      const isActive = a.dataset.section === id;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  // Highlight the active section as it crosses the viewport midpoint
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach(s => sectionObserver.observe(s));

  // Initial state
  setActive('hero');

  /* ---------- scroll progress ---------- */
  // scaleX on a compositor-friendly property, throttled to one write per frame
  const progressFill = document.getElementById('progressFill');
  let progressQueued = false;

  function updateProgress(){
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0;
    if (progressFill) progressFill.style.transform = `scaleX(${pct})`;
    progressQueued = false;
  }

  function queueProgress(){
    if (progressQueued) return;
    progressQueued = true;
    requestAnimationFrame(updateProgress);
  }

  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  updateProgress();


  // Reveal-on-scroll for cards and groups
  // Array.from, not a raw NodeList: NodeList has forEach but not indexOf
  const revealTargets = Array.from(document.querySelectorAll(
    '.fact, .skill-group, .tl-item, .feature-card, .work-card, .contact-link'
  ));
  revealTargets.forEach(el => el.classList.add('reveal'));

  // threshold 0 so an element reveals the moment it edges in, rather than
  // needing 12% of its box on screen (which very tall cards can never reach)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // stagger by the element's own position in the list, so a batch
        // arriving together cascades instead of all popping at once
        const i = revealTargets.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('is-visible'), Math.min(i, 8) * 55);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

  revealTargets.forEach(el => revealObserver.observe(el));

  /* Safety net. A fast flick, a Page Down, or jumping to an anchor can move a
     card from "below the fold" to "already scrolled past" in a single step, so
     the observer never sees it intersect and it would stay at opacity 0
     forever. Anything whose top has reached the viewport gets revealed
     regardless, which keeps the page fail-safe rather than blank. */
  let revealSweepQueued = false;

  function sweepReveals(){
    revealSweepQueued = false;
    const limit = window.innerHeight || document.documentElement.clientHeight;
    revealTargets.forEach(el => {
      if (el.classList.contains('is-visible')) return;
      if (el.getBoundingClientRect().top < limit) el.classList.add('is-visible');
    });
  }

  function queueSweep(){
    if (revealSweepQueued) return;
    revealSweepQueued = true;
    requestAnimationFrame(sweepReveals);
  }

  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep, { passive: true });
  window.addEventListener('load', queueSweep);
  queueSweep();

  /* ---------- anchor scrolling ---------- */
  /* The bar is sticky, so a bare jump to a section parks its heading underneath
     the bar. Offset by the bar's live height, then re-aim after the scroll
     settles: web fonts swap in and the generated .flow diagrams are injected
     after first paint, both of which move the target out from under a one-shot
     measurement. The CSS scroll-padding-top on <html> covers native jumps. */
  const doc = document.documentElement;
  const topbar = document.querySelector('.topbar');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Keep --topbar-h equal to the bar's real height. It feeds scroll-padding-top,
     so this is what keeps anchor offsets correct when the bar reflows across
     breakpoints instead of trusting one hard-coded pixel value. */
  let headerQueued = false;
  function syncHeaderHeight(){
    headerQueued = false;
    if (!topbar) return;
    const h = Math.round(topbar.getBoundingClientRect().height);
    if (h > 0) doc.style.setProperty('--topbar-h', h + 'px');
  }
  function queueHeaderHeight(){
    if (headerQueued) return;
    headerQueued = true;
    requestAnimationFrame(syncHeaderHeight);
  }
  window.addEventListener('resize', queueHeaderHeight);
  window.addEventListener('load', queueHeaderHeight);
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(queueHeaderHeight).catch(() => {});
  }
  queueHeaderHeight();

  /* Measured off the bar's bottom edge rather than its height, so it stays
     correct whether the bar is stuck to the top or still up in the flow. */
  function barOffset(){
    return topbar ? Math.max(0, Math.round(topbar.getBoundingClientRect().bottom)) : 0;
  }

  /* Clamp into the scrollable range: a section near the end of the document
     cannot be pinned to the top of the viewport, and asking for it anyway is
     what leaves you stranded halfway. */
  function targetTop(target){
    const max = doc.scrollHeight - doc.clientHeight;
    const raw = target.getBoundingClientRect().top + window.scrollY - barOffset();
    return Math.max(0, max > 0 ? Math.min(raw, max) : raw);
  }

  /* The mobile menu closes in its own click handler, which runs before this
     one, so by the time we get here the .is-open class is already gone. Ask the
     animated property instead: max-height runs 420px -> 0, so it stays above
     zero for the whole collapse and is exactly 0 once the menu is shut. */
  function menuCollapsing(){
    if (!mobileMenu) return false;
    return parseFloat(getComputedStyle(mobileMenu).maxHeight) > 0;
  }

  function jumpTo(target, delay = 0){
    const behavior = reduceMotion.matches ? 'auto' : 'smooth';
    const go = () => {
      window.scrollTo({ top: targetTop(target), behavior });
      queueProgress();
    };
    if (delay > 0) setTimeout(go, delay);
    else go();
    // Correction passes for late layout shifts and for a target too tall to fit
    // the viewport. Both are no-ops once the position is already right, so a
    // correct first pass costs nothing.
    setTimeout(go, delay + 260);
    setTimeout(go, delay + 760);
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      /* replaceState, not pushState: keep the hash shareable without pushing a
         history entry, which would send Back somewhere this handler does not
         restore. Throws on some file:// origins, hence the guard. */
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* local file */ }
      target.focus({ preventScroll: true });
      // let the mobile menu finish collapsing before the height is measured
      jumpTo(target, menuCollapsing() ? 340 : 0);
    });
  });
});
