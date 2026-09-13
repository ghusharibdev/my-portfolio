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
  ecommerce:    { stages: ['browse', 'cart', 'checkout'] },
  weather:      { stages: ['location', 'fetch', 'forecast'] },
  urlshortener: { stages: ['long url', 'shorten', 'share'] },
  climivo:      { stages: ['weather', 'score', ' guidance'] },
  rxshield:     { stages: ['medication', 'schedule', 'insights'] },
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

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu){
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const sections = ['hero', 'about', 'skills', 'experience', 'work', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const railLinks = Array.from(document.querySelectorAll('.trace-rail a'));
  const traceFill = document.getElementById('traceFill');

  function setActive(id){
    railLinks.forEach(a => a.classList.toggle('active', a.dataset.section === id));
    const idx = sections.findIndex(s => s.id === id);
    if (traceFill && idx > -1){
      const pct = railLinks.length > 1 ? (idx / (railLinks.length - 1)) * 100 : 0;
      traceFill.style.height = pct + '%';
    }
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

  // Reveal-on-scroll for cards and groups
  const revealTargets = document.querySelectorAll(
    '.fact, .skill-group, .tl-item, .feature-card, .work-card, .contact-link'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), (i % 6) * 60);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealTargets.forEach(el => revealObserver.observe(el));

  // Smooth-scroll offset correction for the sticky topbar
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      requestAnimationFrame(() => {
        const topbarHeight = document.querySelector('.topbar')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - topbarHeight + 1;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  });

});
